export type Role = 'admin' | 'customer';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: Role;
  pincode?: string;
  avatar?: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category_name?: string;
  category_slug?: string;
  mrp: number;
  dmart_price: number;
  image: string;
  stock: number;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id?: number;
  product_id: number;
  quantity: number;
  product?: Product;
}

export interface Address {
  id: number;
  user_id: number;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  order_no: string;
  user_id: number;
  username?: string;
  total_amount: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  delivery_pincode: string;
  delivery_address: string;
  items?: OrderItem[];
  created_at: string;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  username: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_amount: number;
  min_order_amount: number;
  is_active: boolean;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  username?: string;
  event_type: string;
  message: string;
  timestamp: string;
}

export interface Vulnerability {
  id: number;
  vuln_id: string; // e.g. VULN-001
  name: string;
  category: string; // OWASP Top 10 category
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  affected_component: string;
  remediation: string;
  remediation_status: 'Open' | 'Fixed';
  retest_result: 'Pending' | 'Pass' | 'Fail';
  created_at: string;
}

export interface SecurityEvidence {
  id: number;
  vuln_id: string | null;
  test_id: string;
  timestamp: string;
  module: string;
  observation: string;
  expected_result: string;
  actual_result: string;
  status: 'PASS' | 'FAIL';
  notes?: string;
}

export interface SecurityRetest {
  id: number;
  finding_id: string;
  tester: string;
  timestamp: string;
  test_result: 'PASS' | 'FAIL';
  notes?: string;
}

export type SecurityMode = 'SECURE' | 'LAB';
