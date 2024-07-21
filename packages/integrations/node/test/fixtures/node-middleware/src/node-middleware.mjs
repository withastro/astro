const combineMiddleware = (...middlewares) => {
    return (req, res, next) => {
        let index = 0;

        const run = (err) => {
            if (err) {
                return next(err);
            }
            if (index >= middlewares.length) {
                return next();
            }
            const middleware = middlewares[index++];
            try {
                middleware(req, res, run);
            } catch (error) {
                next(error);
            }
        };

        run();
    };
};

const middleware_one = (req, res, next) => {
    if (req.url === '/middleware-one') {
        res.end('This is middleware one');
    } else {
        next();
    }
};

const middleware_two = (req, res, next) => {
    if (req.url === '/middleware-two') {
        res.end('This is middleware two');
    } else {
        next();
    }
};

export default combineMiddleware(middleware_one, middleware_two);
