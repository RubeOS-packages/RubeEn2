import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppStatus, DecryptedFile } from './types';
import { encryptFile, decryptFile } from './services/encryptionService';

// --- Icon Components ---

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 15v-6m0 0l-3 3m3-3l3 3" />
    </svg>
);

const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

const LockClosedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.75 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
);


// --- UI Components ---

interface AnimatedContainerProps {
    show: boolean;
    children: React.ReactNode;
    className?: string;
}

const AnimatedContainer: React.FC<AnimatedContainerProps> = ({ show, children, className }) => {
    return (
        <div className={`transition-all duration-500 ease-in-out ${show ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4 pointer-events-none'} ${className}`}>
            {children}
        </div>
    );
};

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    disabled: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            if (e.type === 'dragenter' || e.type === 'dragover') {
                setIsDragging(true);
            } else if (e.type === 'dragleave') {
                setIsDragging(false);
            }
        }
    }, [disabled]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [disabled, onFileSelect]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    }

    const baseClasses = "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300";
    const disabledClasses = "bg-slate-800/20 border-slate-700 cursor-not-allowed";
    const activeClasses = "bg-slate-900/20 border-slate-700 hover:border-cyan-500 hover:bg-slate-900/40";
    const draggingClasses = "border-cyan-400 bg-cyan-900/30 scale-105 shadow-[0_0_25px_rgba(56,189,248,0.4)] animate-pulse";

    const getClasses = () => {
        if (disabled) return `${baseClasses} ${disabledClasses}`;
        if (isDragging) return `${baseClasses} ${draggingClasses}`;
        return `${baseClasses} ${activeClasses}`;
    }

    return (
        <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className="w-full">
            <label htmlFor="dropzone-file" className={getClasses()}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <UploadIcon className={`w-12 h-12 mb-4 transition-colors duration-300 ${isDragging ? 'text-cyan-300' : 'text-slate-500'}`} />
                    <p className="mb-2 text-md text-slate-400"><span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-slate-500">Any file type is supported</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} disabled={disabled} />
            </label>
        </div>
    );
};

// --- Main App Component ---

const App: React.FC = () => {
    const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
    const [file, setFile] = useState<File | null>(null);
    const [encryptedContent, setEncryptedContent] = useState<string | null>(null);
    const [decryptedFile, setDecryptedFile] = useState<DecryptedFile | null>(null);
    const [encryptionPassword, setEncryptionPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [decryptionPasswordInput, setDecryptionPasswordInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Mount animation for the main card
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isProcessing = status === AppStatus.PROCESSING;
    const canReset = status !== AppStatus.IDLE && status !== AppStatus.PROCESSING;

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setStatus(AppStatus.FILE_SELECTED);
        setError(null);
        setEncryptedContent(null);
        setDecryptedFile(null);
        setDecryptionPasswordInput('');
        setEncryptionPassword('');
        setConfirmPassword('');
    };
    
    const handleStartEncrypt = () => {
        if (!file) return;
        setError(null);
        setStatus(AppStatus.AWAITING_PASSWORD_FOR_ENCRYPTION);
    }
    
    const handleProceedWithEncryption = async () => {
        if (!file) return;
        if (!encryptionPassword || !confirmPassword) {
            setError('Please set and confirm your password.');
            return;
        }
        if (encryptionPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setStatus(AppStatus.PROCESSING);
        setError(null);
        await new Promise(res => setTimeout(res, 500)); // Simulate processing time
        try {
            const data = await encryptFile(file, encryptionPassword);
            setEncryptedContent(data);
            setStatus(AppStatus.ENCRYPTED);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during encryption.');
            setStatus(AppStatus.AWAITING_PASSWORD_FOR_ENCRYPTION);
        }
    };

    const handleStartDecrypt = () => {
        if (!file) return;
        setError(null);
        setStatus(AppStatus.AWAITING_PASSWORD_FOR_DECRYPTION);
    };

    const handleProceedWithDecryption = async () => {
        if (!file || !decryptionPasswordInput) {
            setError('Please provide a decryption password.');
            return;
        }
        setStatus(AppStatus.PROCESSING);
        setError(null);
        await new Promise(res => setTimeout(res, 500)); // Simulate processing time
        try {
            const result = await decryptFile(file, decryptionPasswordInput);
            setDecryptedFile(result);
            setStatus(AppStatus.DECRYPTED);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred. The password may be incorrect or the file corrupted.');
            setStatus(AppStatus.AWAITING_PASSWORD_FOR_DECRYPTION);
        }
    };

    const handleDownloadEncrypted = () => {
        if (!encryptedContent || !file) return;
        const blob = new Blob([encryptedContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `encrypted-${file.name}.@#$`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setFile(null);
        setEncryptedContent(null);
        setDecryptedFile(null);
        setError(null);
        setDecryptionPasswordInput('');
        setEncryptionPassword('');
        setConfirmPassword('');
        setStatus(AppStatus.IDLE);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const StatusIndicator = useMemo(() => {
        const baseClass = "text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300";
        switch (status) {
            case AppStatus.IDLE:
                return <span className={`${baseClass} bg-slate-700/50 text-slate-300`}>Waiting for file</span>;
            case AppStatus.FILE_SELECTED:
                return <span className={`${baseClass} bg-blue-500/20 text-blue-300`}>Ready</span>;
            case AppStatus.AWAITING_PASSWORD_FOR_ENCRYPTION:
                 return <span className={`${baseClass} bg-cyan-500/20 text-cyan-300`}><LockClosedIcon className="w-4 h-4" />Set Password</span>;
            case AppStatus.AWAITING_PASSWORD_FOR_DECRYPTION:
                 return <span className={`${baseClass} bg-indigo-500/20 text-indigo-300`}><KeyIcon className="w-4 h-4" />Awaiting Password</span>;
            case AppStatus.PROCESSING:
                return <span className={`${baseClass} bg-amber-500/20 text-amber-300 animate-pulse`}><div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>Processing...</span>;
            case AppStatus.ENCRYPTED:
                return <span className={`${baseClass} bg-green-500/20 text-green-300`}><LockClosedIcon className="w-4 h-4" />Encrypted</span>;
            case AppStatus.DECRYPTED:
                return <span className={`${baseClass} bg-green-500/20 text-green-300`}><CheckCircleIcon className="w-4 h-4" />Decrypted</span>;
            default:
                return null;
        }
    }, [status]);


    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center justify-center p-4 font-sans selection:bg-cyan-300/20 overflow-hidden">
            <div className="absolute inset-0 -z-10 h-full w-full bg-slate-900 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px]"></div>

            <div className={`w-full max-w-2xl mx-auto transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <header className="text-center mb-6">
                     <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-fuchsia-500 flex items-center justify-center gap-2">
                        <SparklesIcon className="w-10 h-10 text-cyan-300/70" />
                        Enception
                    </h1>
                    <p className="text-slate-400 mt-3 tracking-wide">Encrypt and decrypt your files with a personal password, directly in your browser.</p>
                </header>

                <main className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-2xl shadow-2xl shadow-black/40 p-6 md:p-8 space-y-6 relative overflow-hidden min-h-[30rem]">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                        <h2 className="text-xl font-semibold text-slate-200">Control Panel</h2>
                        {StatusIndicator}
                    </div>

                    <div className="relative">
                        <AnimatedContainer show={status === AppStatus.IDLE}>
                            <FileUploader onFileSelect={handleFileSelect} disabled={isProcessing} />
                        </AnimatedContainer>

                        <AnimatedContainer show={status !== AppStatus.IDLE && !!file} className="absolute w-full">
                            {file && (
                                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                                    <div className="flex items-center space-x-4">
                                        <FileIcon className="w-10 h-10 text-cyan-400 flex-shrink-0" />
                                        <div className="flex-grow overflow-hidden">
                                            <p className="text-white font-medium truncate" title={file.name}>{file.name}</p>
                                            <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
                                        </div>
                                        {canReset && (
                                            <button onClick={handleReset} className="text-sm text-slate-400 hover:text-white transition-colors duration-200">Change File</button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </AnimatedContainer>
                        
                        <AnimatedContainer show={!!error}>
                            {error && <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm mt-20"><ExclamationTriangleIcon className="w-5 h-5"/>{error}</div>}
                        </AnimatedContainer>

                        <AnimatedContainer show={status === AppStatus.FILE_SELECTED} className="absolute w-full mt-20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <button onClick={handleStartEncrypt} disabled={isProcessing} className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-cyan-800 disabled:to-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-cyan-900/30 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75">
                                    <LockClosedIcon className="w-5 h-5 mr-2"/> Encrypt
                                </button>
                                <button onClick={handleStartDecrypt} disabled={isProcessing} className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-800 disabled:to-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-indigo-900/30 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75">
                                    <KeyIcon className="w-5 h-5 mr-2"/> Decrypt
                                </button>
                            </div>
                        </AnimatedContainer>
                        
                        <AnimatedContainer show={status === AppStatus.AWAITING_PASSWORD_FOR_ENCRYPTION} className="absolute w-full mt-20">
                           <div className="space-y-4 pt-2">
                                <label className="block text-sm font-medium text-slate-300">Set a Password to Encrypt</label>
                                <input
                                    type="password"
                                    value={encryptionPassword}
                                    onChange={(e) => setEncryptionPassword(e.target.value)}
                                    className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                    placeholder="Enter password..."
                                />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                    placeholder="Confirm password..."
                                />
                                <button onClick={handleProceedWithEncryption} disabled={isProcessing || !encryptionPassword || !confirmPassword} className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-cyan-800 disabled:to-blue-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-cyan-900/30 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75">
                                    <LockClosedIcon className="w-5 h-5 mr-2"/> Encrypt File
                                </button>
                            </div>
                        </AnimatedContainer>

                        <AnimatedContainer show={status === AppStatus.AWAITING_PASSWORD_FOR_DECRYPTION} className="absolute w-full mt-20">
                            <div className="space-y-4 pt-2">
                                <label htmlFor="decryption-key" className="block text-sm font-medium text-slate-300">Enter Decryption Password</label>
                                <input
                                    type="password"
                                    id="decryption-key"
                                    value={decryptionPasswordInput}
                                    onChange={(e) => setDecryptionPasswordInput(e.target.value)}
                                    className="w-full p-3 bg-slate-900/70 border border-slate-700 rounded-lg text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    placeholder="Enter password here..."
                                />
                                <button onClick={handleProceedWithDecryption} disabled={isProcessing || !decryptionPasswordInput} className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-indigo-800 disabled:to-purple-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg shadow-indigo-900/30 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75">
                                    <KeyIcon className="w-5 h-5 mr-2"/> Proceed with Decryption
                                </button>
                            </div>
                        </AnimatedContainer>

                        <AnimatedContainer show={status === AppStatus.ENCRYPTED && !!encryptedContent} className="absolute w-full mt-20">
                             <div className="space-y-4 text-center">
                                 <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/30">
                                    <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4"/>
                                    <h3 className="text-2xl font-semibold text-white">Encryption Successful</h3>
                                    <p className="text-slate-400 mt-2">Your file is now encrypted and ready for download.</p>
                                </div>
                                <button onClick={handleDownloadEncrypted} className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-lg shadow-green-900/30 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75">
                                    <DownloadIcon className="w-5 h-5 mr-2" /> Download Encrypted File (.@#$)
                                </button>
                            </div>
                        </AnimatedContainer>
                        
                        <AnimatedContainer show={status === AppStatus.DECRYPTED && !!decryptedFile} className="absolute w-full mt-20">
                            {decryptedFile && (
                                <div className="space-y-4 text-center">
                                    <div className="bg-green-500/10 p-6 rounded-xl border border-green-500/30">
                                        <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4"/>
                                        <h3 className="text-2xl font-semibold text-white">Decryption Successful</h3>
                                        <p className="text-slate-400 mt-2">Your file is ready to be downloaded.</p>
                                    </div>
                                    <a href={decryptedFile.url} download={decryptedFile.fileName} className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-lg shadow-green-900/30 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75">
                                        <DownloadIcon className="w-5 h-5 mr-2" /> Download Original File
                                    </a>
                                </div>
                            )}
                        </AnimatedContainer>
                    </div>
                </main>
                <footer className="text-center mt-8">
                    <p className="text-xs text-slate-600">All processing is done in your browser. Your files are never uploaded. <br/> Built for users on any platform, including Ubuntu, Windows, and Termux.</p>
                </footer>
            </div>
        </div>
    );
};

export default App;