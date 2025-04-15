// Simple route checking script
const authRoutes = require('./routes/authRoutes');

// Get the routes
const routes = authRoutes._router.stack
  .filter(layer => layer.route)
  .map(layer => {
    const methods = Object.keys(layer.route.methods)
      .filter(method => layer.route.methods[method])
      .map(method => method.toUpperCase());
    
    return {
      path: layer.route.path,
      methods: methods,
      middleware: layer.route.stack
        .filter(handler => handler.name !== '<anonymous>')
        .map(handler => handler.name)
    };
  });

console.log('Auth Routes:');
console.log(JSON.stringify(routes, null, 2));