const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 3000;
app.use(express.json());

// 📦 Global Stock and Menu Configuration (Starts at 75 each)
let menuItems = [
    { id: 1, name: "เนื้อวัวสไลด์ (Beef)", price: 89, stock: 75 },
    { id: 2, name: "หมูสามชั้นสไลด์ (Pork Belly)", price: 69, stock: 75 },
    { id: 3, name: "สันคอหมูสไลด์ (Pork Shoulder)", price: 69, stock: 75 },
    { id: 4, name: "กุ้งสด (Shrimp)", price: 79, stock: 75 },
    { id: 5, name: "ปลาหมึกสด (Squid)", price: 59, stock: 75 },
    { id: 6, name: "ชุดผักรวม (Veggies)", price: 49, stock: 75 },
    { id: 7, name: "ลูกชิ้นปลา (Fish Balls)", price: 39, stock: 75 },
    { id: 8, name: "บะหมี่หยก (Noodles)", price: 20, stock: 75 }
];

// 1. Customer Ordering UI Template Generator
function getTableHTML(tableNum) {
    return `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>เมนูชาบูบุฟเฟต์ - โต๊ะ ${tableNum}</title>
        <style>
            body { font-family: sans-serif; background: #f8f9fa; color: #2c3e50; margin: 0; padding: 10px; }
            h1 { color: #e74c3c; text-align: center; }
            .banner { text-align: center; font-weight: bold; color: white; background: #c0392b; padding: 8px; border-radius: 4px; margin-bottom: 15px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-width: 500px; margin: 0 auto; }
            .card { background: white; border-radius: 6px; padding: 10px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #eee; }
            .stock-lbl { font-size: 0.8rem; color: #27ae60; font-weight: bold; margin: 6px 0; }
            .stock-lbl.out { color: #7f8c8d; }
            .btn { background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; }
            .btn:disabled { background: #bdc3c7; cursor: not-allowed; }
            .cart { max-width: 500px; margin: 20px auto; background: white; padding: 15px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .cart-item { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
            .btn-send { background: #2ecc71; font-size: 1.1rem; padding: 10px; width:100%; border:none; color:white; border-radius:4px; font-weight:bold; cursor:pointer;}
        </style>
        <script src="/socket.io/socket.io.js"></script>
    </head>
    <body>
        <h1>♨️ เมนูชาบูบุฟเฟต์</h1>
        <div class="banner">คุณกำลังสั่งอาหารสำหรับ: โต๊ะ ${tableNum}</div>
        <div class="grid" id="menu-grid"></div>
        
        <div class="cart">
            <h3>🛒 รายการที่เลือก (Your Order)</h3>
            <div id="cart-list"></div>
            <hr>
            <p><strong>หมายเลขโต๊ะ:</strong> โต๊ะ ${tableNum}</p>
            <p><strong>รวมทั้งหมด:</strong> <span id="total-price">0</span> บาท</p>
            <button class="btn-send" onclick="sendOrder()">ส่งรายการอาหาร 🚀</button>
        </div>

        <script>
            var socket = io();
            var tableSign = "โต๊ะ " + ${tableNum};
            var liveMenu = [];
            var cart = {};

            socket.on('update_stock', function(data) {
                liveMenu = data;
                renderMenu();
            });

            function renderMenu() {
                var container = document.getElementById('menu-grid');
                var html = '';
                for (var i = 0; i < liveMenu.length; i++) {
                    var item = liveMenu[i];
                    var isOut = item.stock <= 0;
                    html += '<div class="card">' +
                        '<div><strong>' + item.name + '</strong></div>' +
                        '<div style="color:#c0392b;margin:4px 0;">' + item.price + ' บ.</div>' +
                        '<div class="stock-lbl ' + (isOut ? 'out' : '') + '">' + (isOut ? '❌ หมด' : 'เหลือ: ' + item.stock + ' ที่') + '</div>' +
                        '<button class="btn" onclick="addToCart(' + item.id + ')" ' + (isOut ? 'disabled' : '') + '>' + (isOut ? 'หมด' : 'เพิ่ม ➕') + '</button>' +
                    '</div>';
                }
                container.innerHTML = html;
                renderCart();
            }

            function addToCart(id) {
                var match = liveMenu.find(function(x){ return x.id === id; });
                var inside = cart[id] ? cart[id].quantity : 0;
                if(inside >= match.stock) { alert('ขออภัย วัตถุดิบมีไม่พอ!'); return; }
                if(cart[id]) { cart[id].quantity++; } else { cart[id] = { id: match.id, name: match.name, price: match.price, quantity: 1 }; }
                renderCart();
            }

            function renderCart() {
                var container = document.getElementById('cart-list');
                var total = 0;
                var html = '';
                var keys = Object.keys(cart);
                for(var i=0; i<keys.length; i++) {
                    var item = cart[keys[i]];
                    total += item.price * item.quantity;
                    html += '<div class="cart-item">' +
                        '<span>' + item.name + ' (x' + item.quantity + ')</span>' +
                        '<span>' + (item.price * item.quantity) + ' บาท</span>' +
                    '</div>';
                }
                container.innerHTML = html || '<p style="color:#aaa;">ยังไม่ได้เลือกรายการอาหาร</p>';
                document.getElementById('total-price').innerText = total;
            }

            function sendOrder() {
                var foodArray = [];
                var keys = Object.keys(cart);
                for(var i=0; i<keys.length; i++) { foodArray.push(cart[keys[i]]); }
                if(foodArray.length === 0) { alert('กรุณาเลือกอาหารก่อนส่งครับ'); return; }
                
                var payload = {
                    id: Date.now(),
                    table: tableSign,
                    foods: foodArray,
                    time: new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})
                };
                socket.emit('new_order', payload);
                alert('ส่งออเดอร์เข้าครัวเรียบร้อยแล้วครับ! 🎉');
                cart = {};
                renderCart();
            }
        </script>
    </body>
    </html>`;
}

// 2. Kitchen UI Dashboard String Template
const kitchenHTML = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ระบบรับออเดอร์ห้องครัว (Kitchen Dashboard)</title>
    <style>
        :root { --primary-color: #2c3e50; --accent-color: #e67e22; --bg-color: #ecf0f1; --card-bg: #ffffff; }
        body { font-family: sans-serif; background-color: var(--bg-color); margin: 0; padding: 20px; }
        h1 { text-align: center; color: var(--primary-color); }
        .orders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto 40px auto; }
        .order-card { background: var(--card-bg); border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); border-top: 5px solid var(--accent-color); padding: 15px; display: flex; flex-direction: column; justify-content: space-between; }
        .order-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #eee; padding-bottom: 10px; margin-bottom: 10px; }
        .table-num { font-size: 1.4rem; font-weight: bold; color: #c0392b; }
        .food-list { list-style: none; padding: 0; margin: 0 0 15px 0; flex-grow: 1; }
        .food-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #f1f1f1; }
        .food-qty { font-weight: bold; color: #2e7d32; font-size: 1.1rem; }
        .btn-complete { background-color: #2ecc71; color: white; border: none; padding: 10px; border-radius: 5px; font-weight: bold; cursor: pointer; width: 100%; }
        .btn-complete:hover { background-color: #27ae60; }
        
        .stock-panel { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
        .stock-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-top: 15px; }
        .stock-card { border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
    </style>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <h1>👨‍🍳 รายการส่งอาหารเข้าครัว (Live Tracker)</h1>
    <div class="orders-grid" id="orders-container"></div>

    <div class="stock-panel">
        <h2>📊 Remaining Stock Levels Monitoring (ระบบคุมสต๊อกวัตถุดิบ)</h2>
        <div class="stock-grid" id="kitchen-stock-grid"></div>
    </div>

    <script>
        var socket = io();
        var localOrders = [];

        socket.on('kitchen_receive', function(order) {
            localOrders.push(order);
            renderOrders();
        });

        socket.on('update_stock', function(stockData) {
            var container = document.getElementById('kitchen-stock-grid');
            var html = '';
            for(var i = 0; i < stockData.length; i++) {
                var item = stockData[i];
                var critical = item.stock <= 10;
                html += '<div class="stock-card">' +
                    '<span>' + item.name + '</span>' +
                    '<strong style="color:' + (critical ? '#e74c3c' : '#27ae60') + '">' + (item.stock <= 0 ? 'หมด ❌' : item.stock + ' ที่') + '</strong>' +
                '</div>';
            }
            container.innerHTML = html;
        });

        function renderOrders() {
            const container = document.getElementById('orders-container');
            if (localOrders.length === 0) {
                container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#7f8c8d; padding:20px;">📭 ไม่มีออเดอร์ค้างในระบบครับ...</div>';
                return;
            }
            container.innerHTML = localOrders.map(order => \`
                <div class="order-card">
                    <div>
                        <div class="order-header">
                            <span class="table-num">📍 \${order.table}</span>
                            <span style="color: #7f8c8d;">🕒 \${order.time}</span>
                        </div>
                        <ul class="food-list">
                            \${order.foods.map(food => \`
                                <li class="food-item">
                                    <span>\${food.name}</span>
                                    <span class="food-qty">x \${food.quantity}</span>
                                </li>
                            \`).join('')}
                        </ul>
                    </div>
                    <button class="btn-complete" onclick="completeOrder(\${order.id})">เสิร์ฟแล้ว / เคลียร์ออเดอร์ ✅</button>
                </div>
            \`).join('');
        }

        function completeOrder(orderId) {
            localOrders = localOrders.filter(order => order.id !== orderId);
            renderOrders();
        }
        renderOrders();
    </script>
</body>
</html>`;

// --- 🛠️ 3. Express Routing (Catches all your screenshot paths) ---
app.get('/', (req, res) => res.send(getTableHTML(1)));
app.get('/table/:num', (req, res) => res.send(getTableHTML(req.params.num)));

// Kitchen Dashboard Endpoints (Handles with or without .html, uppercase/lowercase)
app.get('/kitchen', (req, res) => res.send(kitchenHTML));
app.get('/Kitchen', (req, res) => res.send(kitchenHTML));
app.get('/kitchen.html', (req, res) => res.send(kitchenHTML));
app.get('/Kitchen.html', (req, res) => res.send(kitchenHTML));

// Stock Monitoring Redirects (Sends them to the integrated kitchen view dashboard)
app.get('/stock', (req, res) => res.send(kitchenHTML));
app.get('/Stock', (req, res) => res.send(kitchenHTML));
app.get('/stock.html', (req, res) => res.send(kitchenHTML));
app.get('/Stock.html', (req, res) => res.send(kitchenHTML));

// --- 4. Real-time Socket Inventory Connection ---
io.on('connection', (socket) => {
    socket.emit('update_stock', menuItems);

    socket.on('new_order', (orderData) => {
        orderData.foods.forEach(ordered => {
            let match = menuItems.find(m => m.id === ordered.id);
            if (match) {
                match.stock = Math.max(0, match.stock - ordered.quantity);
            }
        });
        io.emit('kitchen_receive', orderData);
        io.emit('update_stock', menuItems); 
    });
});

server.listen(PORT, () => {
    console.log(`Live Server active on port ${PORT}`);
});
