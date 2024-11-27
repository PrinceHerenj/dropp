const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Add this line

// MongoDB connection URI
const uri = "mongodb+srv://princeherenj:Sh353478@cluster0.7xs6q3p.mongodb.net/Dropp-test?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Create a User schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    hostel: String,
    room: String,
    email: String,
    phone: String
});

const User = mongoose.model('User', userSchema);

// Create a Product schema
const productSchema = new mongoose.Schema({
    name: String,
    username: String,
    quantity: String,
    status: String,
    transactionId: String
});

const Product = mongoose.model('Product', productSchema);

// Initialize Express
const app = express();
console.log('Server started');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.use(cookieParser()); // Add this line

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: uri }),
    cookie: { secure: false } // Add this line to configure cookies
}));

// Routes
app.post('/signup', async (req, res) => {
    const { username, password, hostel, room, email, phone } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = new User({ username, password: hashedPassword, hostel, room, email, phone });

    try {
        await user.save();
        res.send({ message: 'Signup successful' });
    } catch (err) {
        res.status(500).send('Error signing up');
    }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ message: 'Invalid username or password.' });
  }

  req.session.user = user;
  res.json({ message: 'Login successful', user }); // Modify this line to send the user object
});

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send({ message: 'Logout successful' });
});

app.post('/products', async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.send(product);
});

app.post('/create-product', async (req, res) => {
    const { name, username, quantity, transactionId } = req.body;
    const product = new Product({ name, username, quantity, status: 'Ordered', transactionId }); // Change status to 'Ordered'

    try {
        await product.save();
        res.send({ message: 'Product created successfully' });
    } catch (err) {
        res.status(500).send('Error creating product');
    }
});

app.get('/user-products', async (req, res) => {
    const username = req.query.username;
    const products = await Product.find({ username });
    res.send(products);
});

app.get('/products/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send('Product not found.');
    res.send(product);
});

app.put('/products/:id', async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).send('Product not found.');
    res.send(product);
});

app.delete('/products/:id', async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).send('Product not found.');
    res.send(product);
});

// Start the server
const port = process.env.PORT || 3200; // Set the port to 3000 or use the environment variable
app.listen(port, () => console.log(`Server running on port ${port}`));
