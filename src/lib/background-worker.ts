import { prisma } from "./prisma";
import { FulfillmentService } from "./fulfillment-service";

export interface ReconcileResult {
  checkedOrders: number;
  confirmedOrders: number;
  expiredOrders: number;
  checkedBuffOrders: number;
  confirmedBuffOrders: number;
  durationMs: number;
}

export class BackgroundPaymentReconciler {
  private static isRunning = false;

  /**
   * Scans all pending orders and buff orders created in the last 45 minutes,
   * checks blockchain/vendor status, and automatically fulfills newly confirmed ones.
   */
  static async reconcile(): Promise<ReconcileResult> {
    if (this.isRunning) {
      console.log("[Reconciler] Previous reconciliation run is still active. Skipping.");
      return {
        checkedOrders: 0,
        confirmedOrders: 0,
        expiredOrders: 0,
        checkedBuffOrders: 0,
        confirmedBuffOrders: 0,
        durationMs: 0,
      };
    }

    this.isRunning = true;
    const start = Date.now();

    let checkedOrders = 0;
    let confirmedOrders = 0;
    let expiredOrders = 0;
    let checkedBuffOrders = 0;
    let confirmedBuffOrders = 0;

    try {
      const windowStart = new Date(Date.now() - 45 * 60 * 1000); // 45 min window

      // 1. Reconcile standard subscription / card orders
      const pendingOrders = await prisma.order.findMany({
        where: {
          paymentStatus: "PENDING",
          createdAt: { gte: windowStart },
        },
        take: 50,
      });

      checkedOrders = pendingOrders.length;

      for (const order of pendingOrders) {
        try {
          const res = await FulfillmentService.checkAndFulfillOrder(order.orderNumber);
          if (res.paid) {
            confirmedOrders++;
            console.log(`[Reconciler] Auto-confirmed & fulfilled order #${order.orderNumber}`);
          } else if (res.status === "EXPIRED") {
            expiredOrders++;
          }
        } catch (orderErr) {
          console.warn(`[Reconciler] Error checking order #${order.orderNumber}:`, orderErr);
        }
      }

      // 2. Reconcile Muse AI Buff Token orders
      const pendingBuff = await prisma.buffOrder.findMany({
        where: {
          paymentStatus: "PENDING",
          createdAt: { gte: windowStart },
        },
        take: 25,
      });

      checkedBuffOrders = pendingBuff.length;

      for (const buff of pendingBuff) {
        try {
          const res = await FulfillmentService.checkAndFulfillBuffOrder(buff.batchId);
          if (res.paymentStatus === "PAID") {
            confirmedBuffOrders++;
            console.log(`[Reconciler] Auto-confirmed Buff Token batch #${buff.batchId}`);
          }
        } catch (buffErr) {
          console.warn(`[Reconciler] Error checking buff order #${buff.batchId}:`, buffErr);
        }
      }
    } finally {
      this.isRunning = false;
    }

    const durationMs = Date.now() - start;
    return {
      checkedOrders,
      confirmedOrders,
      expiredOrders,
      checkedBuffOrders,
      confirmedBuffOrders,
      durationMs,
    };
  }
}
