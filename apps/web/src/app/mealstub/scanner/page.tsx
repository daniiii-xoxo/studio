"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import { ScanLine, ArrowLeft, LoaderCircle, SwitchCamera, History, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@studio/ui";
import { ScrollArea } from "@studio/ui";
import { formatDistanceToNow, isToday, format } from "date-fns";
import { getMealStubs, updateMealStub, createScanLog } from "@/actions/db";
import { useWorkers } from "@/hooks/use-workers";
import jsQR from "jsqr";

type ScanLogEntry = {
    id: string;
    details: string;
    scannerName: string;
    timestamp: Date;
    status: 'success' | 'warning' | 'error';
};

export default function QRScannerPage() {
    const { toast } = useToast();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const isProcessingRef = useRef(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [scanLogs, setScanLogs] = useState<ScanLogEntry[]>([]);
    const [lastScanResult, setLastScanResult] = useState<{
        workerName: string;
        message: string;
        status: 'success' | 'warning' | 'error';
    } | null>(null);

    const { workers } = useWorkers();
    const animFrameRef = useRef<number>(0);
    const streamRef = useRef<MediaStream | null>(null);

    // Get camera devices on auth
    useEffect(() => {
        if (!isAuthenticated) return;
        let isMounted = true;

        const getDevices = async () => {
            try {
                const initialStream = await navigator.mediaDevices.getUserMedia({ video: true });
                initialStream.getTracks().forEach(t => t.stop()); // close probe stream

                if (!isMounted) return;
                setHasCameraPermission(true);

                const all = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = all.filter(d => d.kind === 'videoinput');
                if (!isMounted) return;

                setDevices(videoDevices);
                if (videoDevices.length > 0) {
                    setSelectedDeviceId(videoDevices[0].deviceId);
                }
            } catch (err) {
                if (!isMounted) return;
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Enable camera permissions in your browser to use the scanner.',
                });
            }
        };

        getDevices();
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, toast]);

    const playBeep = useCallback((type: 'success' | 'warning' | 'error' = 'success') => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'success') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);

                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
                gain2.gain.setValueAtTime(0.12, ctx.currentTime + 0.12);
                osc2.start(ctx.currentTime + 0.12);
                osc2.stop(ctx.currentTime + 0.26);
            } else if (type === 'warning') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch {
            // Audio context failed or blocked by browser policy, ignore safely
        }
    }, []);

    const resetScanner = useCallback(() => {
        isProcessingRef.current = false;
        setIsProcessing(false);
    }, []);

    const addLog = (details: string, status: 'success' | 'warning' | 'error') => {
        setScanLogs(prev => [
            {
                id: Date.now().toString(),
                details,
                scannerName: 'Public Kiosk',
                timestamp: new Date(),
                status,
            },
            ...prev,
        ].slice(0, 25));
    };

    const handleScan = useCallback(async (data: string) => {
        if (!data || isProcessingRef.current) return;
        isProcessingRef.current = true;
        setIsProcessing(true);

        const parts = data.split(':');
        let rawWorkerId = parts[1] || parts[0];
        let token: string | undefined = parts[2];
        const type = parts[0];

        if (parts.length === 1) {
            // Direct Worker ID format
            rawWorkerId = parts[0];
            token = undefined;
        } else if (type !== 'MEAL_STUB' && type !== 'COG_USER' && type !== 'ATTENDANCE' && type !== 'STATIC') {
            playBeep('error');
            toast({
                variant: 'destructive',
                title: 'Invalid QR Code',
                description: 'This QR code is not formatted for meal stub claims.',
            });
            setLastScanResult({
                workerName: 'Unknown',
                message: 'Invalid QR Code Format',
                status: 'error',
            });
            setTimeout(resetScanner, 2000);
            return;
        }

        try {
            const worker = workers?.find(
                w => w.id === rawWorkerId || w.workerId === rawWorkerId
            );
            const workerId = worker?.id || rawWorkerId;
            const workerName = worker ? `${worker.firstName} ${worker.lastName}` : `Worker (${rawWorkerId.slice(0, 8)})`;

            // Validate token if provided and worker has a token recorded
            if (worker?.qrToken && token && worker.qrToken !== token) {
                playBeep('error');
                toast({
                    variant: 'destructive',
                    title: 'Invalid or Expired QR',
                    description: 'This QR code has expired. Please use your latest QR code.',
                });
                setLastScanResult({
                    workerName,
                    message: 'QR token has expired',
                    status: 'error',
                });
                setTimeout(resetScanner, 3000);
                return;
            }

            // Fetch stubs for this worker
            const stubs = await getMealStubs({ workerId });
            const validStub = stubs.find(s => {
                if (s.status !== 'Issued') return false;
                const d = s.date instanceof Date ? s.date : new Date(s.date);
                return isToday(d) || format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            });

            if (validStub) {
                await updateMealStub(validStub.id, {
                    status: 'Claimed',
                    claimedAt: new Date(),
                });
                playBeep('success');
                const details = `Claimed meal stub for ${workerName}.`;
                toast({
                    title: 'Meal Stub Claimed!',
                    description: details,
                });
                setLastScanResult({
                    workerName,
                    message: 'Meal stub claimed successfully!',
                    status: 'success',
                });
                addLog(details, 'success');

                try {
                    await createScanLog({
                        scanType: 'Meal Stub',
                        details,
                        mealStubId: validStub.id,
                        targetUserId: workerId,
                        targetUserName: workerName,
                        scannerId: 'public_scanner',
                        scannerName: 'Public Kiosk Scanner',
                    });
                } catch {
                    // Ignore audit log error gracefully
                }
            } else {
                playBeep('warning');
                const details = `No active issued meal stub found for ${workerName} today.`;
                toast({
                    variant: 'destructive',
                    title: 'No Meal Stub Found',
                    description: details,
                });
                setLastScanResult({
                    workerName,
                    message: 'No issued meal stub for today.',
                    status: 'warning',
                });
                addLog(details, 'warning');
            }
        } catch (e: any) {
            playBeep('error');
            console.error('Meal stub scan error:', e);
            toast({
                variant: 'destructive',
                title: 'Scan Error',
                description: 'Could not process meal stub scan. Please try again.',
            });
            setLastScanResult({
                workerName: 'Error',
                message: 'Processing error occurred.',
                status: 'error',
            });
        } finally {
            setTimeout(resetScanner, 2500);
        }
    }, [workers, toast, resetScanner, playBeep]);

    // Unified camera stream & jsQR scan loop
    useEffect(() => {
        if (!isAuthenticated || !hasCameraPermission || !selectedDeviceId) return;

        const videoElement = videoRef.current;
        const canvas = canvasRef.current;
        if (!videoElement || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        let isRunning = true;

        const scan = () => {
            if (!isRunning) return;

            if (videoElement.readyState >= 2 && !isProcessingRef.current) {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: 'dontInvert',
                });

                if (code?.data) {
                    handleScan(code.data);
                }
            }

            animFrameRef.current = requestAnimationFrame(scan);
        };

        const start = async () => {
            try {
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(t => t.stop());
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: { exact: selectedDeviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                });

                if (!isRunning) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                streamRef.current = stream;
                videoElement.srcObject = stream;
                videoElement.play().catch(err => {
                    if (err.name !== 'AbortError') {
                        console.error('Video play error:', err);
                    }
                });

                animFrameRef.current = requestAnimationFrame(scan);
            } catch (err) {
                console.error('Camera stream error:', err);
            }
        };

        start();

        return () => {
            isRunning = false;
            cancelAnimationFrame(animFrameRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, [selectedDeviceId, hasCameraPermission, isAuthenticated, handleScan]);

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background p-4">
                <Card className="w-full max-w-sm rounded-2xl border border-border/80 shadow-md">
                    <CardHeader className="text-center space-y-2 pb-4">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                            <ScanLine className="h-6 w-6" />
                        </div>
                        <CardTitle className="font-headline text-2xl font-bold">Scanner Kiosk</CardTitle>
                        <CardDescription className="text-xs">
                            Enter the kiosk password to unlock camera scanning.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (passwordInput.trim() === 'CogMain123') {
                                    setIsAuthenticated(true);
                                    toast({ title: 'Kiosk Unlocked', description: 'Scanner is now active.' });
                                } else {
                                    toast({
                                        variant: 'destructive',
                                        title: 'Invalid Password',
                                        description: 'Incorrect kiosk password.',
                                    });
                                }
                            }}
                            className="flex flex-col gap-3.5"
                        >
                            <input
                                type="password"
                                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
                                placeholder="Scanner Password"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                autoFocus
                            />
                            <Button type="submit" className="rounded-xl h-10 font-bold">
                                Unlock Scanner
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between border-b px-4 sm:px-6 py-3.5 shrink-0 bg-card/60 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Link href="/meals">
                        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Exit Scanner</span>
                        </Button>
                    </Link>
                    <div className="h-4 w-[1px] bg-border hidden sm:block" />
                    <div>
                        <h1 className="text-lg sm:text-xl font-headline font-bold leading-tight">Meal Stub Scanner</h1>
                        <p className="text-xs text-muted-foreground">Scan QR codes to claim meal stubs in real time.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {devices.length > 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 rounded-xl text-xs"
                            onClick={() => {
                                const idx = devices.findIndex(d => d.deviceId === selectedDeviceId);
                                setSelectedDeviceId(devices[(idx + 1) % devices.length].deviceId);
                            }}
                        >
                            <SwitchCamera className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Switch Camera</span>
                        </Button>
                    )}
                </div>
            </header>

            <main className="grid flex-grow grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {/* Scanner Viewfinder Card */}
                <Card className="flex flex-col rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                    <CardHeader className="text-center pb-3">
                        <div className="flex justify-center mb-1">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                                <ScanLine className="h-5 w-5" />
                            </div>
                        </div>
                        <CardTitle className="font-headline text-xl font-bold">Live Scanner</CardTitle>
                        <CardDescription className="text-xs">Position the worker's QR code in the center frame.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-grow items-center justify-center p-4">
                        <div className="w-full max-w-md space-y-4">
                            <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden shadow-inner border border-border/50">
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    playsInline
                                />
                                {/* Hidden canvas for jsQR capture */}
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Targeting box */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-56 sm:w-64 h-56 sm:h-64 border-2 border-dashed border-primary/80 rounded-2xl animate-pulse" />
                                </div>

                                {isProcessing && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-2">
                                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                                        <span className="text-xs font-bold text-white tracking-wide">Processing Scan...</span>
                                    </div>
                                )}

                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse pointer-events-none" />
                            </div>

                            {/* Live Result Feedback Banner */}
                            {lastScanResult && (
                                <div
                                    className={`p-3.5 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                                        lastScanResult.status === 'success'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                            : lastScanResult.status === 'warning'
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                    }`}
                                >
                                    {lastScanResult.status === 'success' ? (
                                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    ) : lastScanResult.status === 'warning' ? (
                                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                                    ) : (
                                        <XCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-xs">{lastScanResult.workerName}</p>
                                        <p className="text-[11px] opacity-90">{lastScanResult.message}</p>
                                    </div>
                                </div>
                            )}

                            {hasCameraPermission === false && (
                                <Alert variant="destructive" className="rounded-xl">
                                    <AlertTitle>Camera Access Required</AlertTitle>
                                    <AlertDescription>Please allow camera permissions in your browser to scan.</AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Scan History Card */}
                <Card className="flex flex-col rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                    <CardHeader className="pb-3 border-b border-border/60">
                        <CardTitle className="text-base flex items-center gap-2 font-headline font-bold">
                            <History className="h-4 w-4 text-primary" />
                            <span>Recent Kiosk Scans</span>
                        </CardTitle>
                        <CardDescription className="text-xs">Real-time log of scanned meal stubs during this session.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden p-4">
                        <ScrollArea className="h-[360px] sm:h-[440px] pr-3">
                            {scanLogs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                                    <ScanLine className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-xs font-semibold">No recent scans yet</p>
                                    <p className="text-[11px]">Scanned worker meal stubs will show here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {scanLogs.map(log => (
                                        <div
                                            key={log.id}
                                            className="p-3 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors flex items-start gap-2.5"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                    log.status === 'success'
                                                        ? 'bg-emerald-500'
                                                        : log.status === 'warning'
                                                        ? 'bg-amber-500'
                                                        : 'bg-rose-500'
                                                }`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-xs text-foreground leading-snug">{log.details}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {log.scannerName} &bull; {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
