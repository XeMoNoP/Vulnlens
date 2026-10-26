<?php
// DMART CyberLab - Secure Footer Layout
?>
    </main>

    <footer class="bg-slate-900 text-slate-400 border-t border-slate-800 mt-16 pt-12 pb-8">
        <div class="container mx-auto px-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                
                <!-- About Section -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <div class="bg-emerald-600 text-white p-2 rounded-lg font-bold text-sm">
                            <i class="fa-solid fa-basket-shopping"></i>
                        </div>
                        <span class="text-white font-bold text-lg tracking-tight">DMART <span class="text-emerald-500 font-medium text-sm">CyberLab</span></span>
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed mb-3">
                        Your trusted neighborhood supermarket, now online. Get fresh groceries, household items, beverages, and personal care products delivered straight to your door at everyday low prices.
                    </p>
                    <div class="flex gap-3 text-slate-500 mt-4">
                        <span class="hover:text-emerald-500 cursor-pointer transition-colors"><i class="fa-brands fa-facebook text-lg"></i></span>
                        <span class="hover:text-emerald-500 cursor-pointer transition-colors"><i class="fa-brands fa-twitter text-lg"></i></span>
                        <span class="hover:text-emerald-500 cursor-pointer transition-colors"><i class="fa-brands fa-instagram text-lg"></i></span>
                    </div>
                </div>

                <!-- Shopping / Categories -->
                <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wider mb-4">Shop Categories</h4>
                    <ul class="text-xs space-y-2.5">
                        <?php if (isset($nav_categories)): ?>
                            <?php foreach (array_slice($nav_categories, 0, 5) as $cat): ?>
                                <li>
                                    <a href="index.php?category=<?php echo htmlspecialchars($cat['slug'], ENT_QUOTES, 'UTF-8'); ?>" class="hover:text-emerald-500 transition-colors">
                                        <?php echo htmlspecialchars($cat['name'], ENT_QUOTES, 'UTF-8'); ?>
                                    </a>
                                </li>
                            <?php endforeach; ?>
                        <?php endif; ?>
                        <li><a href="index.php" class="hover:text-emerald-500 transition-colors font-semibold">View All Products</a></li>
                    </ul>
                </div>

                <!-- Customer Account & Links -->
                <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wider mb-4">Customer Account</h4>
                    <ul class="text-xs space-y-2.5">
                        <?php if (isset($_SESSION['user_id'])): ?>
                            <li><a href="profile.php" class="hover:text-emerald-500 transition-colors">My Profile & Addresses</a></li>
                            <li><a href="cart.php" class="hover:text-emerald-500 transition-colors">Shopping Bag</a></li>
                            <?php if (isset($_SESSION['role']) && $_SESSION['role'] === 'admin'): ?>
                                <li><a href="admin.php" class="hover:text-emerald-500 transition-colors text-emerald-400 font-semibold">Admin Dashboard</a></li>
                            <?php endif; ?>
                            <li><a href="logout.php" class="hover:text-red-400 transition-colors">Sign Out</a></li>
                        <?php else: ?>
                            <li><a href="login.php" class="hover:text-emerald-500 transition-colors">Sign In</a></li>
                            <li><a href="register.php" class="hover:text-emerald-500 transition-colors">Create Account</a></li>
                            <li><a href="cart.php" class="hover:text-emerald-500 transition-colors">Guest Cart</a></li>
                        <?php endif; ?>
                    </ul>
                </div>

                <!-- Customer Support / Contact -->
                <div>
                    <h4 class="text-white font-bold text-sm uppercase tracking-wider mb-4">Customer Support</h4>
                    <p class="text-xs text-slate-400 leading-relaxed mb-3">
                        Have questions or feedback? Our customer care team is here to help you 7 days a week.
                    </p>
                    <ul class="text-xs space-y-2">
                        <li class="flex items-center gap-2"><i class="fa-solid fa-phone text-emerald-500"></i> Toll Free: 1800-XXX-XXXX</li>
                        <li class="flex items-center gap-2"><i class="fa-solid fa-envelope text-emerald-500"></i> support@dmartcyberlab.local</li>
                        <li class="flex items-center gap-2"><i class="fa-solid fa-location-dot text-emerald-500"></i> Mumbai, Maharashtra, India</li>
                    </ul>
                </div>
            </div>

            <hr class="border-slate-800 my-6">

            <div class="flex flex-col sm:flex-row items-center justify-between text-[11px] gap-4 text-slate-500">
                <span>&copy; <?php echo date("Y"); ?> DMART CyberLab. All rights reserved.</span>
                <div class="flex items-center gap-4">
                    <span class="hover:text-slate-400 transition-colors cursor-help" title="Academic environment simulation only. No real orders are placed.">Local Simulator Sandbox</span>
                    <span>&bull;</span>
                    <span class="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 uppercase tracking-wider font-semibold">
                        SecLvl: <?php echo htmlspecialchars(SECURITY_MODE, ENT_QUOTES, 'UTF-8'); ?>
                    </span>
                </div>
            </div>
        </div>
    </footer>

</body>
</html>
