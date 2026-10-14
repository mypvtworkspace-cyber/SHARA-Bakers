import { Order, OrderStatus } from '../types';

export type OrderEventType = 'ORDER_CREATED' | 'ORDER_STATUS_CHANGED' | 'PAYMENT_CONFIRMED';

export interface OrderEventPayload {
  type: OrderEventType;
  order: Order;
  timestamp: string;
}

type OrderEventListener = (payload: OrderEventPayload) => void;

class OrderEventsService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<OrderEventListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('sb_orders_channel_v1');
        this.channel.onmessage = (event: MessageEvent<OrderEventPayload>) => {
          this.notifyListeners(event.data);
        };
      } catch {
        this.channel = null;
      }
    }
  }

  public subscribe(listener: OrderEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(payload: OrderEventPayload): void {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('Error in order event listener', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sb:order:event', { detail: payload })
      );
    }
  }

  public emitOrderCreated(order: Order): void {
    const payload: OrderEventPayload = {
      type: 'ORDER_CREATED',
      order,
      timestamp: new Date().toISOString(),
    };
    this.notifyListeners(payload);
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.error('Failed to postMessage to BroadcastChannel', err);
      }
    }
  }

  public emitOrderStatusChanged(order: Order): void {
    const payload: OrderEventPayload = {
      type: 'ORDER_STATUS_CHANGED',
      order,
      timestamp: new Date().toISOString(),
    };
    this.notifyListeners(payload);
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.error('Failed to postMessage to BroadcastChannel', err);
      }
    }
  }

  public emitPaymentConfirmed(order: Order): void {
    const payload: OrderEventPayload = {
      type: 'PAYMENT_CONFIRMED',
      order,
      timestamp: new Date().toISOString(),
    };
    this.notifyListeners(payload);
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch (err) {
        console.error('Failed to postMessage to BroadcastChannel', err);
      }
    }
  }
}

export const orderEvents = new OrderEventsService();
