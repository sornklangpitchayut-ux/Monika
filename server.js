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
    { id: 1, name: "Beef Slices", price: 89, stock: 75 },
    { id: 2, name: "Pork Belly Slices", price: 69, stock: 75 },
    { id: 3, name: "Pork Shoulder Slices", price: 69, stock: 75 },
    { id: 4, name: "Fresh Shrimp", price: 79, stock: 75 },
    { id: 5, name: "Fresh Squid", price: 59, stock: 75 },
    { id: 6, name: "Mixed Veggies Set", price: 49, stock: 75 },
    { id: 7, name: "Fish Balls", price: 39, stock: 75 },
    { id: 8, name: "Green Noodles", price: 20, stock: 75 }
];

// 1. Dynamic Customer Ordering Page HTML Generator
function getTableHTML(tableNum) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shabu Me You - Table ${tableNum}</title>
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
        <h1>♨️ Shabu Buffet Menu</h1>
        <div class="banner">You are ordering for: Table ${tableNum}</div>
        <div class="grid" id="menu-grid"></div>
        
        <div class="cart">
            <h3>🛒 Your Order</h3>
            <div id="cart-list"></div>
            <hr>
            <p><strong>Location:</strong> Table ${tableNum}</p>
            <p><strong>Total Price:</strong> <span id="total-price">0</span> THB</p>
            <button class="btn-send" onclick="sendOrder()">Send Order to Kitchen 🚀</button>
        </div>

        <script>
            var socket = io();
            var tableSign = "Table " + ${tableNum};
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
                        '<div style="color:#c0392b;margin:4px 0;">' + item.price + ' THB</div>' +
                        '<div class="stock-lbl ' + (isOut ? 'out' : '') + '">' + (isOut ? '❌ Out of Stock' : 'Stock: ' + item.stock + ' left') + '</div>' +
                        '<button class="btn" onclick="addToCart(' + item.id + ')" ' + (isOut ? 'disabled' : '') + '>' + (isOut ? 'Sold Out' : 'Add ➕') + '</button>' +
                    '</div>';
                }
                container.innerHTML = html;
                renderCart();
            }

            function addToCart(id) {
                var match = liveMenu.find(function(x){ return x.id === id; });
                var inside = cart[id] ? cart[id].quantity : 0;
                if(inside >= match.stock) { alert('Sorry, not enough items left in stock!'); return; }
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
                        '<span>' + (item.price * item.quantity) + ' THB</span>' +
                    '</div>';
                }
                container.innerHTML = html || '<p style="color:#aaa;">No items selected yet.</p>';
                document.getElementById('total-price').innerText = total;
            }

            function sendOrder() {
                var foodArray = [];
                var keys = Object.keys(cart);
                for(var i=0; i<keys.length; i++) { foodArray.push(cart[keys[i]]); }
                if(foodArray.length === 0) { alert('Please pick items before checking out.'); return; }
                
                var payload = {
                    id: Date.now(),
                    table: tableSign,
                    foods: foodArray,
                    time: new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
                };
                socket.emit('new_order', payload);
                alert('Order successfully sent to kitchen! 🎉');
                cart = {};
                renderCart();
            }
        </script>
    </body>
    </html>`;
}

// 2. Kitchen Dashboard View & Live Stock Panel HTML
const kitchenHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kitchen Tracker</title>
    <style>
        body { font-family: sans-serif; background: #ecf0f1; padding: 20px; margin:0; }
        h1 { text-align: center; color: #2c3e50; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto 40px auto; }
        .box { background: white; border-radius: 8px; padding: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #e67e22; }
        .box-hd { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 10px; border-bottom: 1px dashed #ddd; padding-bottom: 5px; }
        .food-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 0.95rem; }
        .done-btn { width: 100%; background: #2ecc71; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px; }
        
        .stock-panel { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .stock-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-top: 15px; }
        .stock-card { border: 1px solid #ddd; padding: 10px; border-radius: 4px; display: flex; justify-content: space-between; background: #fafafa; }
    </style>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>
    <h1>👨‍🍳 Live Kitchen Incoming Orders</h1>
    <div class="grid" id="orders-box"></div>

    <div class="stock-panel">
        <h2>📊 Remaining Stock Levels Monitoring</h2>
        <div class="stock-grid" id="kitchen-stock-grid"></div>
    </div>

    <script>
        var socket = io();
        var orders = [];

        socket.on('kitchen_receive', function(data) {
            orders.push(data);
            drawOrders();
        });

        socket.on('update_stock', function(stockData) {
            var container = document.getElementById('kitchen-stock-grid');
            var html = '';
            for(var i=0; i<stockData.length; i++) {
                var item = stockData[i];
                html += '<div class="stock-card">' +
                    '<span>' + item.name + '</span>' +
                    '<strong style="color:' + (item.stock <= 5 ? '#e74c3c' : '#27ae60') + '">' + item.stock + ' left</strong>' +
                '</div>';
            }
            container.innerHTML = html;
        });

        function drawOrders() {
            var container = document.getElementById('orders-box');
            if(orders.length === 0) { container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#95a5a6;">No active pending orders.</p>'; return; }
            var html = '';
            for(var i=0; i<orders.length; i++) {
                var order = orders[i];
                var fHtml = '';
                for(var j=0; j<order.foods.length; j++) {
                    fHtml += '<div class="food-row"><span>' + order.foods[j].name + '</span><strong>x' + order.foods[j].quantity + '</strong></div>';
                }
                html += '<div class="box">' +
                    '<div class="box-hd"><span style="color:#e67e22;">📍 ' + order.table + '</span><span style="font-size:0.8rem;color:#95a5a6;">🕒 ' + order.time + '</span></div>' +
                    '<div>' + fHtml + '</div>' +
                    '<button class="done-btn" onclick="clearBox(' + order.id + ')">Served ✅</button>' +
                '</div>';
            }
            container.innerHTML = html;
        }

        function clearBox(id) {
            orders = orders.filter(function(x){ return x.id !== id; });
            drawOrders();
        }
        drawOrders();
    </script>
</body>
</html>`;

// --- Express Routing Engine (Compatible with Express v5 path syntax) ---
app.get('/', (req, res) => res.send(getTableHTML(1)));
app.get('/Kitchen.html', (req, res) => res.send(kitchenHTML));
app.get('/Kitchen', (req, res) => res.send(kitchenHTML));
app.get('/table/:num', (req, res) => res.send(getTableHTML(req.params.num)));

// --- Real-time Socket.io Inventory Management ---
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
    console.log(`Live Restaurant Server running on port: ${PORT}`);
});
