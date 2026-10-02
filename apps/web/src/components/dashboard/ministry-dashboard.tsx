"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@studio/ui';
import { Badge } from '@studio/ui';
import { LoaderCircle, CheckCircle2, Clock, Calendar, Users, Package, ArrowRight } from 'lucide-react';
import type { ApprovalRequest, Worker, Ministry, Booking } from '@studio/types';
import Link from 'next/link';
import { Button } from '@studio/ui';
import { useUserRole } from '@/hooks/use-user-role';
import { format } from 'date-fns';
import { useApprovals } from '@/hooks/use-approvals';
import { useWorkers } from '@/hooks/use-workers';

export function MinistryDashboard() {
    const { workerProfile, myMinistryIds, isSuperAdmin } = useUserRole();
    const { approvals: allApprovals, isLoading: approvalsLoading } = useApprovals();
    const { workers: allWorkers, isLoading: workersLoading } = useWorkers();

    // Filter approvals for this ministry's users
    const myApprovals = React.useMemo(() => {
        if (!allApprovals || !allWorkers || isSuperAdmin) return (allApprovals as any[]) || [];

        return (allApprovals as any[]).filter(req => {
            if (!req.status.startsWith('Pending')) return false;

            // If it's a ministry change, check if it's incoming or outgoing for one of my ministries
            if (req.type === 'Ministry Change') {
                if (req.status === 'Pending Outgoing Approval') {
                    return myMinistryIds.includes(req.oldMajorId || '') || myMinistryIds.includes(req.oldMinorId || '');
                }
                if (req.status === 'Pending Incoming Approval') {
                    return myMinistryIds.includes(req.newMajorId || '') || myMinistryIds.includes(req.newMinorId || '');
                }
            }

            // Otherwise check if the requester belongs to one of my ministries
            const requester = allWorkers.find(w => w.id === req.workerId);
            if (!requester) return false;

            return (
                myMinistryIds.includes(requester.majorMinistryId) ||
                myMinistryIds.includes(requester.minorMinistryId) ||
                (Array.isArray(requester.assignedMinistryIds) && requester.assignedMinistryIds.some((id: string) => myMinistryIds.includes(id)))
            );
        });
    }, [allApprovals, allWorkers, myMinistryIds, isSuperAdmin]);

    const isLoading = approvalsLoading || workersLoading;

    if (isLoading) {
        return (
            <Card className="flex items-center justify-center p-8 h-[200px]">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </Card>
        );
    }

    const pendingCount = myApprovals.length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Approvals Summary Card */}
            <Card className="md:col-span-2 shadow-sm border-primary/10 bg-gradient-to-br from-background to-primary/5">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-headline font-bold">Ministry Approvals</CardTitle>
                            <CardDescription>Requests requiring your attention as Ministry Head/Approver</CardDescription>
                        </div>
                        <Badge variant={pendingCount > 0 ? "default" : "secondary"} className="h-8 px-4 text-sm rounded-full">
                            {pendingCount} Pending
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {pendingCount > 0 ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-background border shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Workers</span>
                                    </div>
                                    <p className="text-3xl font-black">{myApprovals.filter(a => a.type === 'New Worker' || a.type === 'Profile Update' || a.type === 'Ministry Change').length}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-background border shadow-sm">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                            <Calendar className="h-4 w-4" />
                                        </div>
                                        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rooms</span>
                                    </div>
                                    <p className="text-3xl font-black">{myApprovals.filter(a => a.type === 'Room Booking').length}</p>
                                </div>
                            </div>
                            <Button asChild className="w-full h-11 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                                <Link href="/approvals" className="flex items-center justify-center gap-2">
                                    Go to Approvals Center <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 opacity-60">
                            <div className="p-4 bg-muted rounded-full">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">You're all caught up!</p>
                                <p className="text-sm">There are no pending requests for your ministry.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="shadow-sm border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                    <CardDescription>Management shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 hover:bg-secondary">
                        <Link href="/settings/venue-elements">
                            <Package className="h-4 w-4 text-primary" />
                            Manage Venue Elements
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 hover:bg-secondary">
                        <Link href="/workers">
                            <Users className="h-4 w-4 text-primary" />
                            My Ministry Workers
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start h-12 gap-3 hover:bg-secondary">
                        <Link href="/reservations/masterview">
                            <Calendar className="h-4 w-4 text-primary" />
                            Ministry Schedule
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
