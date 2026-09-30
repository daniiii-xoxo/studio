import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { makeApproval, makeWorker } from "./fixtures";

// Minimal stubs for @studio/ui components used by KanbanCard
vi.mock("@studio/ui", () => ({
  Card: ({ children, onClick, className }: any) => <div data-testid="card" className={className} onClick={onClick}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>{children}</button>
  ),
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ src }: any) => <img src={src} alt="" />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
  Badge: ({ children, className }: any) => <span className={className}>{children}</span>,
  AlertDialog: ({ children, open }: any) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

vi.mock("lucide-react", () => ({
  XCircle: () => <svg data-testid="icon-xcircle" />,
  CheckCircle2: () => <svg data-testid="icon-check" />,
  Clock: () => <svg data-testid="icon-clock" />,
  ChevronRight: () => <svg data-testid="icon-chevron" />,
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { KanbanCard } from "@/components/approvals/kanban-card";

describe("KanbanCard", () => {
  const onUpdateStatus = vi.fn();
  const onClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders requester name and details", () => {
    const request = makeApproval({ requester: "Jane Smith", details: "Some details" });
    render(
      <KanbanCard
        request={request}
        onUpdateStatus={onUpdateStatus}
        canManage={false}
        onClick={onClick}
        isUpdating={false}
      />,
    );
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText(/"Some details"/)).toBeInTheDocument();
  });

  it("renders the request type badge", () => {
    const request = makeApproval({ type: "Room Booking" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={false} onClick={onClick} isUpdating={false} />,
    );
    expect(screen.getByText("Room Booking")).toBeInTheDocument();
  });

  it("calls onClick when card is clicked", () => {
    const request = makeApproval();
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={false} onClick={onClick} isUpdating={false} />,
    );
    fireEvent.click(screen.getByTestId("card"));
    expect(onClick).toHaveBeenCalledWith(request);
  });

  it("does NOT show approve/reject buttons when canManage is false", () => {
    const request = makeApproval({ status: "Pending" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={false} onClick={onClick} isUpdating={false} />,
    );
    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    expect(screen.queryByText("Reject")).not.toBeInTheDocument();
  });

  it("does NOT show approve/reject buttons when status is not Pending", () => {
    const request = makeApproval({ status: "Approved" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={true} onClick={onClick} isUpdating={false} />,
    );
    expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    expect(screen.queryByText("Reject")).not.toBeInTheDocument();
  });

  it("shows approve/reject buttons when canManage=true and status is Pending", () => {
    const request = makeApproval({ status: "Pending" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={true} onClick={onClick} isUpdating={false} />,
    );
    expect(screen.getByText("Approve")).toBeInTheDocument();
    expect(screen.getByText("Reject")).toBeInTheDocument();
  });

  it("calls onUpdateStatus with Approved when Approve is clicked", () => {
    const request = makeApproval({ status: "Pending" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={true} onClick={onClick} isUpdating={false} />,
    );
    fireEvent.click(screen.getByText("Approve"));
    fireEvent.click(screen.getByText("Yes, Approve"));
    expect(onUpdateStatus).toHaveBeenCalledWith(request, "Approved");
    // clicking action buttons should NOT bubble up to card onClick
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onUpdateStatus with Rejected when Reject is clicked", () => {
    const request = makeApproval({ status: "Pending" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={true} onClick={onClick} isUpdating={false} />,
    );
    fireEvent.click(screen.getByText("Reject"));
    fireEvent.click(screen.getByText("Yes, Reject"));
    expect(onUpdateStatus).toHaveBeenCalledWith(request, "Rejected");
  });

  it("disables buttons when isUpdating is true", () => {
    const request = makeApproval({ status: "Pending" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={true} onClick={onClick} isUpdating={true} />,
    );
    expect(screen.getByText("Approve").closest("button")).toBeDisabled();
    expect(screen.getByText("Reject").closest("button")).toBeDisabled();
  });

  it("shows Pending Outgoing status as a pending card with action buttons", () => {
    const request = makeApproval({ status: "Pending Outgoing Approval" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={true} onClick={onClick} isUpdating={false} />,
    );
    expect(screen.getByText("Approve")).toBeInTheDocument();
  });

  it("renders requester worker avatar fallback initial", () => {
    const request = makeApproval({ requester: "Alice" });
    render(
      <KanbanCard request={request} onUpdateStatus={onUpdateStatus} canManage={false} onClick={onClick} isUpdating={false} />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
  });
});
