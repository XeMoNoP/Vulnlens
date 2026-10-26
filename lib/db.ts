import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Product,
  CartItem,
  Address,
  Order,
  OrderItem,
  Review,
  Coupon,
  AuditLog,
  Vulnerability,
  SecurityEvidence,
  SecurityRetest,
  SecurityMode,
} from './types';

interface DatabaseSchema {
  settings: Record<string, string>;
  users: User[];
  categories: Category[];
  products: Product[];
  inventory: Record<number, number>; // product_id -> stock
  cartItems: CartItem[];
  addresses: Address[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  auditLogs: AuditLog[];
  vulnerabilities: Vulnerability[];
  securityEvidence: SecurityEvidence[];
  securityRetests: SecurityRetest[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function getInitialData(): DatabaseSchema {
  // Pre-seed bcrypt password hashes:
  // 'admin123' and 'customer123'
  const adminHash = bcrypt.hashSync('admin123', 10);
  const customerHash = bcrypt.hashSync('customer123', 10);

  return {
    settings: {
      security_mode: 'SECURE',
    },
    users: [
      {
        id: 1,
        username: 'admin',
        password_hash: adminHash,
        role: 'admin',
        avatar: 'default.png',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        username: 'customer',
        password_hash: customerHash,
        role: 'customer',
        pincode: '400001',
        avatar: 'default.png',
        created_at: new Date().toISOString(),
      },
    ],
    categories: [
      { id: 1, name: 'Rice, Atta & Dals', slug: 'rice-atta-dals' },
      { id: 2, name: 'Cooking Oils & Ghee', slug: 'oils-ghee' },
      { id: 3, name: 'Beverages', slug: 'beverages' },
      { id: 4, name: 'Snacks & Biscuits', slug: 'snacks-biscuits' },
      { id: 5, name: 'Dairy & Packaged Food', slug: 'dairy-packaged' },
      { id: 6, name: 'Personal Care & Household', slug: 'personal-household' },
    ],
    products: [
      {
        id: 1,
        name: 'Premium Basmati Rice (5kg)',
        description: 'Long-grain premium basmati rice, perfect for biryani and daily meals.',
        category_id: 1,
        category_name: 'Rice, Atta & Dals',
        category_slug: 'rice-atta-dals',
        mrp: 650.0,
        dmart_price: 549.0,
        image: 'basmati_rice.png',
        stock: 50,
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Chakki Fresh Atta (10kg)',
        description: '100% whole wheat flour milled to perfection for soft, delicious rotis.',
        category_id: 1,
        category_name: 'Rice, Atta & Dals',
        category_slug: 'rice-atta-dals',
        mrp: 460.0,
        dmart_price: 399.0,
        image: 'placeholder.png',
        stock: 40,
        created_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Refined Sunflower Oil (1L)',
        description: 'Healthy cooking oil enriched with vitamins A & D.',
        category_id: 2,
        category_name: 'Cooking Oils & Ghee',
        category_slug: 'oils-ghee',
        mrp: 180.0,
        dmart_price: 149.0,
        image: 'sunflower_oil.png',
        stock: 100,
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        name: 'Pure Cow Ghee (1L)',
        description: 'Aromatic and pure cow ghee, traditional taste and rich quality.',
        category_id: 2,
        category_name: 'Cooking Oils & Ghee',
        category_slug: 'oils-ghee',
        mrp: 720.0,
        dmart_price: 649.0,
        image: 'ghee.png',
        stock: 25,
        created_at: new Date().toISOString(),
      },
      {
        id: 5,
        name: 'Assam Premium Tea (500g)',
        description: 'Strong and aromatic black tea leaves sourced from Assam gardens.',
        category_id: 3,
        category_name: 'Beverages',
        category_slug: 'beverages',
        mrp: 240.0,
        dmart_price: 199.0,
        image: 'placeholder.png',
        stock: 60,
        created_at: new Date().toISOString(),
      },
      {
        id: 6,
        name: 'Toor Dal Premium (1kg)',
        description: 'Unpolished protein-rich toor dal, essential for everyday nutritious meals.',
        category_id: 1,
        category_name: 'Rice, Atta & Dals',
        category_slug: 'rice-atta-dals',
        mrp: 175.0,
        dmart_price: 142.0,
        image: 'placeholder.png',
        stock: 80,
        created_at: new Date().toISOString(),
      },
    ],
    inventory: {
      1: 50,
      2: 40,
      3: 100,
      4: 25,
      5: 60,
      6: 80,
    },
    cartItems: [],
    addresses: [
      {
        id: 1,
        user_id: 2,
        address_line: 'Flat 402, Green Valley Apartments, Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        is_default: true,
      },
    ],
    orders: [
      {
        id: 1,
        order_no: 'ORD-20261025-8491',
        user_id: 2,
        username: 'customer',
        total_amount: 698.0,
        status: 'Delivered',
        delivery_pincode: '400001',
        delivery_address: 'Flat 402, Green Valley Apartments, Andheri West, Mumbai, 400001',
        items: [
          {
            id: 1,
            order_id: 1,
            product_id: 1,
            product_name: 'Premium Basmati Rice (5kg)',
            quantity: 1,
            price: 549.0,
          },
          {
            id: 2,
            order_id: 1,
            product_id: 3,
            product_name: 'Refined Sunflower Oil (1L)',
            quantity: 1,
            price: 149.0,
          },
        ],
        created_at: '2026-10-25T10:30:00Z',
      },
    ],
    reviews: [
      {
        id: 1,
        product_id: 1,
        user_id: 2,
        username: 'customer',
        rating: 5,
        comment: 'Excellent grain length and aromatic flavor for biryani.',
        created_at: '2026-10-25T11:00:00Z',
      },
    ],
    coupons: [
      {
        id: 1,
        code: 'DMART50',
        discount_amount: 50.0,
        min_order_amount: 500.0,
        is_active: true,
      },
      {
        id: 2,
        code: 'SAVER100',
        discount_amount: 100.0,
        min_order_amount: 1000.0,
        is_active: true,
      },
    ],
    auditLogs: [
      {
        id: 1,
        user_id: 1,
        username: 'admin',
        event_type: 'SYSTEM_INIT',
        message: 'VulnLens and DMART CyberLab initialized successfully.',
        timestamp: new Date().toISOString(),
      },
    ],
    vulnerabilities: [
      {
        id: 1,
        vuln_id: 'VULN-001',
        name: 'SQL Injection',
        category: 'A05:2025 - Injection',
        severity: 'High',
        description: 'User-supplied search input could reach the SQL interpreter as code if concatenated into the query string.',
        affected_component: 'index.php (search field)',
        remediation: 'Prepared statements (PDO) / Parameterized ORM queries',
        remediation_status: 'Fixed',
        retest_result: 'Pass',
        created_at: '2026-10-25T11:14:00Z',
      },
      {
        id: 2,
        vuln_id: 'VULN-002',
        name: 'Reflected XSS',
        category: 'A05:2025 - Injection',
        severity: 'Medium',
        description: 'Echoing the search term back into the page without encoding could let a crafted value run as script in the browser.',
        affected_component: 'index.php (query echo)',
        remediation: 'React JSX automatic contextual escaping / htmlspecialchars()',
        remediation_status: 'Fixed',
        retest_result: 'Pass',
        created_at: '2026-10-25T11:14:00Z',
      },
      {
        id: 3,
        vuln_id: 'VULN-003',
        name: 'IDOR',
        category: 'A01:2025 - Broken Access Control',
        severity: 'High',
        description: 'An invoice could be read by changing the order reference in the URL if ownership were not checked.',
        affected_component: 'download_invoice.php /api/invoices',
        remediation: 'Session ownership validation on the order',
        remediation_status: 'Fixed',
        retest_result: 'Pass',
        created_at: '2026-10-25T11:14:00Z',
      },
      {
        id: 4,
        vuln_id: 'VULN-004',
        name: 'Weak Password Hashing',
        category: 'A04:2025 - Cryptographic Failures',
        severity: 'Medium',
        description: 'Storing passwords with a fast or unsalted hash would allow rapid cracking if the database were disclosed.',
        affected_component: 'register.php / login.php',
        remediation: 'BCrypt password hashing with high salt work factor',
        remediation_status: 'Fixed',
        retest_result: 'Pass',
        created_at: '2026-10-25T11:14:00Z',
      },
      {
        id: 5,
        vuln_id: 'VULN-005',
        name: 'CSRF',
        category: 'A01:2025 - Broken Access Control',
        severity: 'Medium',
        description: 'A state-changing form submitted from another site could act as the logged-in user without a token check.',
        affected_component: 'State-changing forms & APIs',
        remediation: 'SameSite cookies and per-session CSRF token validation',
        remediation_status: 'Fixed',
        retest_result: 'Pass',
        created_at: '2026-10-25T11:14:00Z',
      },
      {
        id: 6,
        vuln_id: 'VULN-006',
        name: 'Parameter Tampering',
        category: 'A06:2025 - Insecure Design',
        severity: 'Medium',
        description: 'A negative or oversized cart quantity submitted directly could corrupt totals if not range-checked.',
        affected_component: 'cart.php (quantity input)',
        remediation: 'Server-side positive-integer validation & stock bounding',
        remediation_status: 'Fixed',
        retest_result: 'Pass',
        created_at: '2026-10-25T11:14:00Z',
      },
      {
        id: 7,
        vuln_id: 'VULN-007',
        name: 'Sensitive Information Leakage',
        category: 'A10:2025 - Exceptional Conditions',
        severity: 'Low',
        description: 'A database exception shown to the user could leak internal details. SECURE mode must show a clean message.',
        affected_component: 'checkout.php',
        remediation: 'Try-catch transaction rollback and sanitized client errors',
        remediation_status: 'Fixed',
        retest_result: 'Pass',
        created_at: '2026-10-25T11:14:00Z',
      },
      {
        id: 8,
        vuln_id: 'VULN-008',
        name: 'Security Misconfiguration',
        category: 'A02:2025 - Security Misconfiguration',
        severity: 'Low',
        description: 'Directory listing of the uploads folder could expose stored files if the index were not disabled.',
        affected_component: '/uploads directory & public assets',
        remediation: 'Disable directory listing and script execution via .htaccess/framework routing',
        remediation_status: 'Fixed',
        retest_result: 'Pass',
        created_at: '2026-10-25T11:14:00Z',
      },
    ],
    securityEvidence: [
      {
        id: 1,
        vuln_id: 'VULN-001',
        test_id: 'TEST-SQLI-01',
        timestamp: '2026-10-25T11:20:00Z',
        module: 'index.php (search)',
        observation: 'SQL Injection check',
        expected_result: 'Search uses a prepared statement with a bound parameter.',
        actual_result: 'Search query is prepared and the term is bound as data (LIKE ?).',
        status: 'PASS',
        notes: 'Automated VulnLens check',
      },
      {
        id: 2,
        vuln_id: 'VULN-002',
        test_id: 'TEST-XSS-01',
        timestamp: '2026-10-25T11:20:00Z',
        module: 'index.php (query echo)',
        observation: 'Reflected XSS check',
        expected_result: 'The search term is HTML-encoded before being shown.',
        actual_result: 'Search term is output through htmlspecialchars().',
        status: 'PASS',
        notes: 'Automated VulnLens check',
      },
    ],
    securityRetests: [],
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {
      // Fallback if filesystem write is restricted (e.g. read-only serverless environment)
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(data?: DatabaseSchema) {
    const toSave = data || this.data;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    } catch {
      // Best effort in serverless environment
    }
  }

  // Settings & Security Mode
  public getSecurityMode(): SecurityMode {
    return (this.data.settings.security_mode as SecurityMode) || 'SECURE';
  }

  public setSecurityMode(mode: SecurityMode): void {
    this.data.settings.security_mode = mode;
    this.save();
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: number): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase().trim()
    );
  }

  public createUser(username: string, passwordHash: string, role: 'admin' | 'customer' = 'customer'): User {
    const newId = this.data.users.length ? Math.max(...this.data.users.map((u) => u.id)) + 1 : 1;
    const newUser: User = {
      id: newId,
      username: username.trim(),
      password_hash: passwordHash,
      role,
      avatar: 'default.png',
      created_at: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  public updateUserPincode(userId: number, pincode: string): boolean {
    const user = this.getUserById(userId);
    if (user) {
      user.pincode = pincode.slice(0, 6);
      this.save();
      return true;
    }
    return false;
  }

  // Categories & Products
  public getCategories(): Category[] {
    return this.data.categories;
  }

  public getProducts(search?: string, categorySlug?: string): Product[] {
    let list = this.data.products.map((p) => ({
      ...p,
      stock: this.data.inventory[p.id] ?? p.stock,
    }));

    if (categorySlug) {
      list = list.filter((p) => p.category_slug === categorySlug);
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public getProductById(id: number): Product | undefined {
    const prod = this.data.products.find((p) => p.id === id);
    if (!prod) return undefined;
    return {
      ...prod,
      stock: this.data.inventory[prod.id] ?? prod.stock,
    };
  }

  public createProduct(data: Omit<Product, 'id' | 'created_at'>): Product {
    const newId = this.data.products.length ? Math.max(...this.data.products.map((p) => p.id)) + 1 : 1;
    const cat = this.data.categories.find((c) => c.id === data.category_id);
    const newProduct: Product = {
      id: newId,
      ...data,
      category_name: cat ? cat.name : 'General',
      category_slug: cat ? cat.slug : 'general',
      created_at: new Date().toISOString(),
    };
    this.data.products.push(newProduct);
    this.data.inventory[newId] = data.stock || 0;
    this.save();
    return newProduct;
  }

  public updateProduct(id: number, data: Partial<Product>): Product | undefined {
    const index = this.data.products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    if (data.category_id) {
      const cat = this.data.categories.find((c) => c.id === data.category_id);
      if (cat) {
        data.category_name = cat.name;
        data.category_slug = cat.slug;
      }
    }

    this.data.products[index] = { ...this.data.products[index], ...data };
    if (typeof data.stock === 'number') {
      this.data.inventory[id] = data.stock;
    }
    this.save();
    return this.getProductById(id);
  }

  public deleteProduct(id: number): boolean {
    const prevLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    delete this.data.inventory[id];
    this.save();
    return this.data.products.length < prevLen;
  }

  public updateStock(productId: number, newStock: number): boolean {
    if (newStock < 0) return false;
    this.data.inventory[productId] = newStock;
    const prod = this.data.products.find((p) => p.id === productId);
    if (prod) prod.stock = newStock;
    this.save();
    return true;
  }

  // Cart
  public getCart(userId?: number): (CartItem & { product: Product })[] {
    const items = userId
      ? this.data.cartItems.filter((c) => c.user_id === userId)
      : this.data.cartItems.filter((c) => !c.user_id);

    return items
      .map((item) => {
        const prod = this.getProductById(item.product_id);
        if (!prod) return null;
        return { ...item, product: prod };
      })
      .filter(Boolean) as (CartItem & { product: Product })[];
  }

  public addToCart(productId: number, quantity: number, userId?: number): { success: boolean; message?: string } {
    const prod = this.getProductById(productId);
    if (!prod) return { success: false, message: 'Product not found.' };

    const stock = this.data.inventory[productId] ?? prod.stock;
    const existing = userId
      ? this.data.cartItems.find((c) => c.user_id === userId && c.product_id === productId)
      : this.data.cartItems.find((c) => !c.user_id && c.product_id === productId);

    const newQty = existing ? existing.quantity + quantity : quantity;
    if (newQty > stock) {
      return { success: false, message: `Only ${stock} items available in stock.` };
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      const newId = this.data.cartItems.length ? Math.max(...this.data.cartItems.map((c) => c.id)) + 1 : 1;
      this.data.cartItems.push({
        id: newId,
        user_id: userId,
        product_id: productId,
        quantity,
      });
    }

    this.save();
    return { success: true };
  }

  public updateCartQuantity(productId: number, quantity: number, userId?: number): { success: boolean; message?: string } {
    if (quantity <= 0) {
      return this.removeFromCart(productId, userId);
    }

    const prod = this.getProductById(productId);
    if (!prod) return { success: false, message: 'Product not found.' };

    const stock = this.data.inventory[productId] ?? prod.stock;
    if (quantity > stock) {
      return { success: false, message: `Requested quantity exceeds stock (${stock}).` };
    }

    const item = userId
      ? this.data.cartItems.find((c) => c.user_id === userId && c.product_id === productId)
      : this.data.cartItems.find((c) => !c.user_id && c.product_id === productId);

    if (item) {
      item.quantity = quantity;
      this.save();
      return { success: true };
    }
    return { success: false, message: 'Item not in cart.' };
  }

  public removeFromCart(productId: number, userId?: number): { success: boolean } {
    if (userId) {
      this.data.cartItems = this.data.cartItems.filter(
        (c) => !(c.user_id === userId && c.product_id === productId)
      );
    } else {
      this.data.cartItems = this.data.cartItems.filter(
        (c) => !(!c.user_id && c.product_id === productId)
      );
    }
    this.save();
    return { success: true };
  }

  public clearCart(userId?: number) {
    if (userId) {
      this.data.cartItems = this.data.cartItems.filter((c) => c.user_id !== userId);
    } else {
      this.data.cartItems = this.data.cartItems.filter((c) => Boolean(c.user_id));
    }
    this.save();
  }

  // Orders & Transactional Checkout
  public createOrder(
    userId: number,
    deliveryAddress: string,
    pincode: string,
    couponCode?: string
  ): { success: boolean; order?: Order; error?: string } {
    const cart = this.getCart(userId);
    if (cart.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }

    // Verify stock availability for all items before debiting
    for (const item of cart) {
      const stock = this.data.inventory[item.product_id] ?? 0;
      if (item.quantity > stock) {
        return {
          success: false,
          error: `Insufficient stock for ${item.product.name}. Available: ${stock}`,
        };
      }
    }

    // Calculate subtotal
    let subtotal = cart.reduce((acc, curr) => acc + curr.product.dmart_price * curr.quantity, 0);

    // Apply Coupon if valid
    let discount = 0;
    if (couponCode) {
      const c = this.getCoupon(couponCode);
      if (c && c.is_active && subtotal >= c.min_order_amount) {
        discount = c.discount_amount;
      }
    }
    const finalAmount = Math.max(0, subtotal - discount);

    // Decrement inventory (Transaction execution)
    for (const item of cart) {
      this.data.inventory[item.product_id] = (this.data.inventory[item.product_id] || 0) - item.quantity;
      const prod = this.data.products.find((p) => p.id === item.product_id);
      if (prod) prod.stock = this.data.inventory[item.product_id];
    }

    const orderId = this.data.orders.length ? Math.max(...this.data.orders.map((o) => o.id)) + 1 : 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderNo = `ORD-${dateStr}-${rand}`;

    const user = this.getUserById(userId);
    const orderItems: OrderItem[] = cart.map((ci, idx) => ({
      id: idx + 1,
      order_id: orderId,
      product_id: ci.product_id,
      product_name: ci.product.name,
      quantity: ci.quantity,
      price: ci.product.dmart_price,
    }));

    const order: Order = {
      id: orderId,
      order_no: orderNo,
      user_id: userId,
      username: user ? user.username : 'Unknown',
      total_amount: finalAmount,
      status: 'Pending',
      delivery_address: deliveryAddress,
      delivery_pincode: pincode,
      items: orderItems,
      created_at: new Date().toISOString(),
    };

    this.data.orders.push(order);
    this.clearCart(userId);
    this.save();

    this.logAuditEvent(userId, 'ORDER_PLACED', `Order ${orderNo} placed for Rs. ${finalAmount}`);

    return { success: true, order };
  }

  public getOrders(userId?: number): Order[] {
    if (userId) {
      return this.data.orders
        .filter((o) => o.user_id === userId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [...this.data.orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public getOrderByOrderNo(orderNo: string): Order | undefined {
    return this.data.orders.find((o) => o.order_no === orderNo);
  }

  public updateOrderStatus(orderId: number, status: Order['status']): boolean {
    const o = this.data.orders.find((ord) => ord.id === orderId);
    if (o) {
      o.status = status;
      this.save();
      return true;
    }
    return false;
  }

  // Addresses
  public getAddresses(userId: number): Address[] {
    return this.data.addresses.filter((a) => a.user_id === userId);
  }

  public addAddress(userId: number, address: Omit<Address, 'id' | 'user_id'>): Address {
    const newId = this.data.addresses.length ? Math.max(...this.data.addresses.map((a) => a.id)) + 1 : 1;
    const newAddr: Address = {
      id: newId,
      user_id: userId,
      ...address,
    };
    if (newAddr.is_default) {
      this.data.addresses.forEach((a) => {
        if (a.user_id === userId) a.is_default = false;
      });
    }
    this.data.addresses.push(newAddr);
    this.save();
    return newAddr;
  }

  public deleteAddress(id: number, userId: number): boolean {
    const prevLen = this.data.addresses.length;
    this.data.addresses = this.data.addresses.filter((a) => !(a.id === id && a.user_id === userId));
    this.save();
    return this.data.addresses.length < prevLen;
  }

  // Reviews
  public getReviews(productId: number): Review[] {
    return this.data.reviews
      .filter((r) => r.product_id === productId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public addReview(productId: number, userId: number, rating: number, comment: string): Review {
    const user = this.getUserById(userId);
    const newId = this.data.reviews.length ? Math.max(...this.data.reviews.map((r) => r.id)) + 1 : 1;
    const review: Review = {
      id: newId,
      product_id: productId,
      user_id: userId,
      username: user ? user.username : 'customer',
      rating,
      comment,
      created_at: new Date().toISOString(),
    };
    this.data.reviews.push(review);
    this.save();
    return review;
  }

  // Coupons
  public getCoupon(code: string): Coupon | undefined {
    return this.data.coupons.find(
      (c) => c.code.toLowerCase() === code.toLowerCase().trim() && c.is_active
    );
  }

  // Audit Logs
  public logAuditEvent(userId: number | null, eventType: string, message: string) {
    const user = userId ? this.getUserById(userId) : null;
    const newId = this.data.auditLogs.length ? Math.max(...this.data.auditLogs.map((a) => a.id)) + 1 : 1;
    const log: AuditLog = {
      id: newId,
      user_id: userId,
      username: user ? user.username : undefined,
      event_type: eventType,
      message,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.push(log);
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // VulnLens Register, Evidence & Retests
  public getVulnerabilities(): Vulnerability[] {
    return this.data.vulnerabilities;
  }

  public updateVulnerabilityStatus(vulnId: string, remediationStatus: 'Open' | 'Fixed', retestResult: 'Pass' | 'Fail' | 'Pending') {
    const v = this.data.vulnerabilities.find((item) => item.vuln_id === vulnId);
    if (v) {
      v.remediation_status = remediationStatus;
      v.retest_result = retestResult;
      this.save();
    }
  }

  public getSecurityEvidence(): SecurityEvidence[] {
    return [...this.data.securityEvidence].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addSecurityEvidence(evidence: Omit<SecurityEvidence, 'id' | 'timestamp'>): SecurityEvidence {
    const newId = this.data.securityEvidence.length ? Math.max(...this.data.securityEvidence.map((e) => e.id)) + 1 : 1;
    const entry: SecurityEvidence = {
      id: newId,
      ...evidence,
      timestamp: new Date().toISOString(),
    };
    this.data.securityEvidence.push(entry);
    this.save();
    return entry;
  }

  public getSecurityRetests(): SecurityRetest[] {
    return [...this.data.securityRetests].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addSecurityRetest(retest: Omit<SecurityRetest, 'id' | 'timestamp'>): SecurityRetest {
    const newId = this.data.securityRetests.length ? Math.max(...this.data.securityRetests.map((r) => r.id)) + 1 : 1;
    const entry: SecurityRetest = {
      id: newId,
      ...retest,
      timestamp: new Date().toISOString(),
    };
    this.data.securityRetests.push(entry);

    // Dynamic Vulnerability Register synchronization:
    // A PASS closes the finding (Fixed); a FAIL reopens it (Open).
    const isPass = retest.test_result === 'PASS';
    this.updateVulnerabilityStatus(
      retest.finding_id,
      isPass ? 'Fixed' : 'Open',
      isPass ? 'Pass' : 'Fail'
    );

    this.save();
    return entry;
  }
}

// Global Singleton to ensure state persistence across API routes and page requests
const globalForDb = global as unknown as { dbInstance?: Database };
export const db = globalForDb.dbInstance || new Database();
if (process.env.NODE_ENV !== 'production') globalForDb.dbInstance = db;
