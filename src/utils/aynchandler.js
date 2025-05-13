const asyncHandler = (requestHandler) => {
    return async (req, response, next) => {
        try {
            await requestHandler(req, response, next);
        } catch (err) {
            next(err);
        }
    };
};

export { asyncHandler };
