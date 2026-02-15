
import React from 'react';
import { CheckCircle, ZoomIn, Ticket } from 'lucide-react';
import { AppSettings, User } from '../../types';
import { doc, updateDoc, addDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface AdminPaymentsProps {
  paymentRequests: any[];
  users: User[];
  tickets: any[];
  settings: AppSettings;
  showAlert: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  setSelectedReceipt: (url: string | null) => void;
  t: any;
}

const AdminPayments: React.FC<AdminPaymentsProps> = ({
  paymentRequests,
  users,
  tickets,
  settings,
  showAlert,
  setSelectedReceipt,
  t
}) => {

  const handleApprovePayment = async (req: any) => {
    const { id: reqId, userId, amount, requestedTicket } = req;
    
    // 1. Get User Details
    const targetUser = users.find(u => u.id === userId);
    const userName = targetUser ? targetUser.name : 'Unknown User';

    // 2. Update Request Status
    const reqRef = doc(db, 'payment_requests', reqId);
    await updateDoc(reqRef, { status: 'APPROVED' });
    
    // 3. Handle Ticket Assignment
    let assignedTicketNum = 0;
    
    // Check if the requested ticket is already in the system (could be PENDING reservation)
    if (requestedTicket) {
        const existingTicket = tickets.find(t => 
            t.cycle === settings.cycle && 
            t.ticketNumber === requestedTicket
        );

        if (existingTicket) {
            // Case A: It's the reservation for this user (Status: PENDING)
            if (existingTicket.userId === userId && existingTicket.status === 'PENDING') {
                const ticketRef = doc(db, 'tickets', existingTicket.id);
                await updateDoc(ticketRef, { status: 'ACTIVE', assignedBy: 'ADMIN' });
                assignedTicketNum = requestedTicket;
            } 
            // Case B: It's taken by someone else or already active
            else {
                // Conflict resolution: Find next available
                const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
                const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
                
                let nextTicketNum = 1;
                while (takenNumbers.has(nextTicketNum)) {
                    nextTicketNum++;
                }
                assignedTicketNum = nextTicketNum;
                
                // Create NEW ticket since the requested one was unavailable
                const newTicket: any = {
                    ticketNumber: assignedTicketNum,
                    userId: userId,
                    userName: userName,
                    cycle: settings.cycle,
                    status: 'ACTIVE',
                    assignedDate: new Date().toISOString().split('T')[0],
                    assignedBy: 'SYSTEM'
                };
                await addDoc(collection(db, 'tickets'), newTicket);

                showAlert('warning', 'Ticket Conflict', `Requested ticket #${requestedTicket} was not available (Status: ${existingTicket.status}). System assigned #${assignedTicketNum} instead.`);
            }
        } else {
            // Case C: Requested, but no record exists (maybe user deleted it or race condition, or legacy request)
            assignedTicketNum = requestedTicket;
            const newTicket: any = {
                ticketNumber: assignedTicketNum,
                userId: userId,
                userName: userName,
                cycle: settings.cycle,
                status: 'ACTIVE',
                assignedDate: new Date().toISOString().split('T')[0],
                assignedBy: 'USER'
            };
            await addDoc(collection(db, 'tickets'), newTicket);
        }
    } else {
        // Case D: No specific ticket requested (Auto-assign)
        const currentCycleTickets = tickets.filter(t => t.cycle === settings.cycle);
        const takenNumbers = new Set(currentCycleTickets.map(t => t.ticketNumber));
        
        let nextTicketNum = 1;
        while (takenNumbers.has(nextTicketNum)) {
            nextTicketNum++;
        }
        assignedTicketNum = nextTicketNum;

        const newTicket: any = {
            ticketNumber: assignedTicketNum,
            userId: userId,
            userName: userName,
            cycle: settings.cycle,
            status: 'ACTIVE',
            assignedDate: new Date().toISOString().split('T')[0],
            assignedBy: 'SYSTEM'
        };
        await addDoc(collection(db, 'tickets'), newTicket);
    }

    // 4. Update user status, contribution
    if (userId) {
        const userRef = doc(db, 'users', userId.toString());
        await updateDoc(userRef, {
            status: 'VERIFIED',
            contribution: (targetUser?.contribution || 0) + amount,
            prizeNumber: assignedTicketNum // Keeping for compatibility, though we rely on tickets collection
        });
    }
    
    if (assignedTicketNum === requestedTicket) {
        showAlert('success', 'Payment Verified', `User verified and Ticket #${assignedTicketNum} has been activated.`);
    }
  };

  const handleRejectPayment = async (req: any) => {
    const { id: reqId, userId, requestedTicket } = req;

    // 1. Reject Request
    const reqRef = doc(db, 'payment_requests', reqId);
    await updateDoc(reqRef, { status: 'REJECTED' });

    // 2. Void/Delete Pending Ticket Reservation
    if (requestedTicket) {
        const reservation = tickets.find(t => 
            t.cycle === settings.cycle && 
            t.ticketNumber === requestedTicket &&
            t.userId === userId &&
            t.status === 'PENDING'
        );
        
        if (reservation) {
            await deleteDoc(doc(db, 'tickets', reservation.id));
        }
    }

    showAlert('info', 'Payment Rejected', 'The payment has been rejected and ticket reservation cleared.');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
        <h1 className="text-2xl font-bold text-stone-800">{t.payments.title}</h1>
        {paymentRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">{t.payments.allCaughtUp}</h3>
                <p className="text-stone-500">{t.payments.noRequests}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentRequests.map((req) => (
                    <div key={req.id} className="bg-white rounded-xl shadow-md border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="h-48 bg-stone-100 relative group cursor-pointer" onClick={() => setSelectedReceipt(req.receiptUrl)}>
                            <img src={req.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ZoomIn className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-stone-800">{req.userName}</h3>
                                    <p className="text-stone-500 text-sm">{req.userPhone}</p>
                                </div>
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-bold">PENDING</span>
                            </div>
                            <div className="bg-stone-50 p-3 rounded-lg mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-stone-500 text-sm">{t.payments.amount}:</span>
                                    <span className="font-bold text-emerald-700">{req.amount.toLocaleString()} ETB</span>
                                </div>
                                {req.requestedTicket && (
                                    <div className="flex items-center text-emerald-800 bg-emerald-100/50 px-2 py-1 rounded">
                                        <Ticket className="w-3 h-3 mr-2" />
                                        <span className="text-xs font-bold">Req. Lucky #: {req.requestedTicket}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <button 
                                    onClick={() => handleRejectPayment(req)}
                                    className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-bold transition-colors"
                                >
                                    {t.payments.reject}
                                </button>
                                <button 
                                    onClick={() => handleApprovePayment(req)}
                                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-bold transition-colors shadow-lg shadow-emerald-200"
                                >
                                    {t.payments.approve}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default AdminPayments;
