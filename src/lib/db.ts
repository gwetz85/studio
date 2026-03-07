import Dexie, { type Table } from 'dexie';

export interface ServicePackage {
  id?: number;
  name: string;
  price: number;
  description: string;
  speed: string;
}

export interface Customer {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  packageId: number;
  status: 'active' | 'passive' | 'inactive';
  modemSnMac?: string; // Field baru untuk SN/MAC Modem
  createdAt: number;
  deactivationDate?: number; // Tanggal saat status berubah menjadi Non-Aktif
}

export interface PSBRequest {
  id?: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  packageId: number;
  status: 'pasif' | 'aktif';
  modemSnMac?: string; // Field baru untuk SN/MAC Modem
  createdAt: number;
}

export interface Payment {
  id?: number;
  customerId: number;
  amount: number;
  billingPeriod: string; // e.g., "2023-10"
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: number;
}

export class NetInvoiceDB extends Dexie {
  customers!: Table<Customer>;
  packages!: Table<ServicePackage>;
  payments!: Table<Payment>;
  psb!: Table<PSBRequest>;

  constructor() {
    super('MTNETBillingDB');
    this.version(3).stores({
      customers: '++id, name, email, packageId, status, deactivationDate',
      packages: '++id, name',
      payments: '++id, customerId, billingPeriod, status',
      psb: '++id, name, email, packageId, status'
    });
  }
}

export const db = new NetInvoiceDB();
