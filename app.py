import os
import csv
from io import StringIO
from datetime import datetime
from flask import Flask, render_template, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy

from dotenv import load_dotenv
import urllib.parse

load_dotenv()

app = Flask(__name__)

# Configuración de base de datos
basedir = os.path.abspath(os.path.dirname(__file__))

# Datos de Azure SQL
server = 'analytics-server-ronaldo-valbuena.database.windows.net'
database = 'analyticsdb'
username = 'ronaldo'
password = os.environ.get('DB_PASSWORD')
driver = '{ODBC Driver 18 for SQL Server}' # Driver recomendado para Azure App Service Linux

if password:
    # Usar Azure SQL si la contraseña está configurada
    params = urllib.parse.quote_plus(f"DRIVER={driver};SERVER={server};DATABASE={database};UID={username};PWD={password}")
    app.config['SQLALCHEMY_DATABASE_URI'] = f"mssql+pyodbc:///?odbc_connect={params}"
else:
    # Fallback a SQLite para desarrollo local
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'pos_database.db')

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

class Client(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    document = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(50))
    client_type = db.Column(db.String(20), default='Minorista')

    def to_dict(self):
        return {
            'id': self.id,
            'document': self.document,
            'name': self.name,
            'phone': self.phone,
            'client_type': self.client_type
        }

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    barcode = db.Column(db.String(50), unique=True, nullable=False)
    price = db.Column(db.Float, nullable=False)
    wholesale_price = db.Column(db.Float, nullable=False, default=0.0)
    cost = db.Column(db.Float, nullable=False)
    stock = db.Column(db.Integer, default=0)
    origin = db.Column(db.String(20), default='Nacional')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'barcode': self.barcode,
            'price': self.price,
            'wholesale_price': self.wholesale_price,
            'cost': self.cost,
            'stock': self.stock,
            'origin': self.origin
        }

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.now)
    total = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(50), default='Efectivo')
    sale_type = db.Column(db.String(20), default='Detal')
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=True)
    client = db.relationship('Client')
    items = db.relationship('SaleItem', backref='sale', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S'),
            'total': self.total,
            'payment_method': self.payment_method,
            'sale_type': self.sale_type,
            'client_name': self.client.name if self.client else 'Consumidor Final',
            'items': [item.to_dict() for item in self.items]
        }

class SaleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product.name,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'subtotal': self.quantity * self.unit_price
        }

class InventoryMovement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    type = db.Column(db.String(10), nullable=False) # 'IN' or 'OUT'
    quantity = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, default=datetime.now)
    reason = db.Column(db.String(200))
    product = db.relationship('Product')

    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product.name,
            'type': self.type,
            'quantity': self.quantity,
            'date': self.date.strftime('%Y-%m-%d %H:%M:%S'),
            'reason': self.reason
        }

# Inicializar Base de Datos
with app.app_context():
    db.create_all()
    # Insertar datos de prueba si no existen
    if not Client.query.first():
        c1 = Client(document='123456789', name='Consumidor Frecuente', phone='3000000000', client_type='Minorista')
        c2 = Client(document='987654321', name='Distribuidor Mayorista', phone='3111111111', client_type='Mayorista')
        db.session.add_all([c1, c2])
        db.session.commit()

    if not Product.query.first():
        p1 = Product(name='Camiseta Deportiva', barcode='123456789', price=45000, wholesale_price=35000, cost=20000, stock=50, origin='Nacional')
        p2 = Product(name='Zapatillas Running', barcode='987654321', price=150000, wholesale_price=120000, cost=90000, stock=30, origin='Importado')
        db.session.add_all([p1, p2])
        db.session.commit()

# Rutas API
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/products', methods=['GET'])
def get_products():
    query = request.args.get('q', '')
    if query:
        products = Product.query.filter((Product.barcode == query) | (Product.name.ilike(f'%{query}%'))).all()
    else:
        products = Product.query.all()
    return jsonify([p.to_dict() for p in products])

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.json
    try:
        new_prod = Product(
            name=data['name'],
            barcode=data['barcode'],
            price=float(data['price']),
            wholesale_price=float(data.get('wholesale_price', data['price'])),
            cost=float(data.get('cost', 0)),
            stock=int(data.get('stock', 0)),
            origin=data.get('origin', 'Nacional')
        )
        db.session.add(new_prod)
        
        # Registrar movimiento inicial si hay stock
        if new_prod.stock > 0:
            db.session.flush() # Para obtener el ID
            mov = InventoryMovement(product_id=new_prod.id, type='IN', quantity=new_prod.stock, reason='Inventario inicial')
            db.session.add(mov)
            
        db.session.commit()
        return jsonify({'success': True, 'product': new_prod.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/products/<int:id>', methods=['PUT'])
def update_product(id):
    data = request.json
    product = Product.query.get(id)
    if not product:
        return jsonify({'success': False, 'error': 'Product not found'}), 404
        
    try:
        if 'name' in data: product.name = data['name']
        if 'barcode' in data: product.barcode = data['barcode']
        if 'price' in data: product.price = float(data['price'])
        if 'wholesale_price' in data: product.wholesale_price = float(data['wholesale_price'])
        if 'cost' in data: product.cost = float(data['cost'])
        if 'stock' in data: product.stock = int(data['stock'])
        if 'origin' in data: product.origin = data['origin']
        
        db.session.commit()
        return jsonify({'success': True, 'product': product.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'success': False, 'error': 'Product not found'}), 404
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'No se puede eliminar este producto porque tiene ventas registradas'}), 400

@app.route('/api/sales', methods=['POST'])
def create_sale():
    data = request.json
    items = data.get('items', [])
    if not items:
        return jsonify({'success': False, 'error': 'No items in sale'}), 400

    try:
        total = sum(item['quantity'] * item['price'] for item in items)
        client_id = data.get('client_id')
        sale = Sale(
            total=total, 
            payment_method=data.get('payment_method', 'Efectivo'), 
            sale_type=data.get('sale_type', 'Detal'),
            client_id=int(client_id) if client_id else None
        )
        db.session.add(sale)
        db.session.flush()

        for item in items:
            product = Product.query.get(item['product_id'])
            if product:
                if product.stock < item['quantity']:
                    raise ValueError(f'Stock insuficiente para {product.name}')
                
                # Descontar stock
                product.stock -= item['quantity']
                
                # Crear detalle
                sale_item = SaleItem(
                    sale_id=sale.id,
                    product_id=product.id,
                    quantity=item['quantity'],
                    unit_price=item['price']
                )
                db.session.add(sale_item)
                
                # Registrar movimiento
                mov = InventoryMovement(
                    product_id=product.id,
                    type='OUT',
                    quantity=item['quantity'],
                    reason=f'Venta #{sale.id}'
                )
                db.session.add(mov)

        db.session.commit()
        return jsonify({'success': True, 'sale': sale.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/sales', methods=['GET'])
def get_sales():
    sales = Sale.query.order_by(Sale.date.desc()).limit(50).all()
    return jsonify([s.to_dict() for s in sales])

@app.route('/api/export/sales', methods=['GET'])
def export_sales():
    sales = Sale.query.order_by(Sale.date.desc()).all()
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['ID_Venta', 'Fecha', 'Tipo', 'Metodo_Pago', 'Total'])
    for s in sales:
        cw.writerow([s.id, s.date.strftime('%Y-%m-%d %H:%M:%S'), s.sale_type, s.payment_method, s.total])
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=reporte_ventas.csv"
    output.headers["Content-type"] = "text/csv"
    return output

@app.route('/api/inventory/move', methods=['POST'])
def inventory_move():
    data = request.json
    try:
        product = Product.query.get(data['product_id'])
        if not product:
            return jsonify({'success': False, 'error': 'Product not found'}), 404
            
        qty = int(data['quantity'])
        type_move = data['type'] # 'IN' or 'OUT'
        
        if type_move == 'OUT' and product.stock < qty:
            return jsonify({'success': False, 'error': 'Stock insuficiente'}), 400
            
        if type_move == 'IN':
            product.stock += qty
        else:
            product.stock -= qty
            
        mov = InventoryMovement(
            product_id=product.id,
            type=type_move,
            quantity=qty,
            reason=data.get('reason', 'Ajuste manual')
        )
        db.session.add(mov)
        db.session.commit()
        
        return jsonify({'success': True, 'product': product.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

# Rutas de Clientes
@app.route('/api/clients', methods=['GET'])
def get_clients():
    clients = Client.query.all()
    return jsonify([c.to_dict() for c in clients])

@app.route('/api/clients', methods=['POST'])
def create_client():
    data = request.json
    try:
        new_client = Client(
            document=data['document'],
            name=data['name'],
            phone=data.get('phone', ''),
            client_type=data.get('client_type', 'Minorista')
        )
        db.session.add(new_client)
        db.session.commit()
        return jsonify({'success': True, 'client': new_client.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/clients/<int:id>', methods=['PUT'])
def update_client(id):
    data = request.json
    client = Client.query.get(id)
    if not client:
        return jsonify({'success': False, 'error': 'Client not found'}), 404
    try:
        if 'document' in data: client.document = data['document']
        if 'name' in data: client.name = data['name']
        if 'phone' in data: client.phone = data['phone']
        if 'client_type' in data: client.client_type = data['client_type']
        db.session.commit()
        return jsonify({'success': True, 'client': client.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/clients/<int:id>', methods=['DELETE'])
def delete_client(id):
    client = Client.query.get(id)
    if not client:
        return jsonify({'success': False, 'error': 'Client not found'}), 404
    try:
        db.session.delete(client)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'No se puede eliminar este cliente porque tiene ventas registradas'}), 400
@app.route('/api/dashboard', methods=['GET'])
def dashboard_stats():
    # Ventas del día
    today = datetime.now().date()
    sales = Sale.query.all()
    today_sales = [s for s in sales if s.date.date() == today]
    today_total = sum(s.total for s in today_sales)
    
    # Productos stock bajo (< 10)
    low_stock = Product.query.filter(Product.stock < 10).count()
    
    return jsonify({
        'today_sales_total': today_total,
        'today_sales_count': len(today_sales),
        'low_stock_alerts': low_stock
    })

if __name__ == '__main__':
    app.run(debug=False)
