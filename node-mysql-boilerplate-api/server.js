require('rootpath')();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./_middleware/error-handler');

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Log all API requests for debugging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} from ${req.ip}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', req.body);
    }
    next();
});

// api routes
app.use('/accounts', require('./accounts/account.controller'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Server listening on port ' + port));
