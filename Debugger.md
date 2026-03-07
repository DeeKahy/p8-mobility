# How and when to use Debugger

## When errors can happen i could be a good ideer to log the error.

```javascript
try {
  // API CALL
} catch (error) {
  logger.debug(`Failed to post data: ${error.message}`, ' error ');
}
```

## Are you interested in how an object looks?

```javascript
const user = {
  id: 123,
  name: 'Anna',
  role: 'admin',
};

logger.info('User object:', user);
```

## Interested in seeing the proces of things happening?

```javascript
logger.info('Starting user creation');
const user = await createUser(userData);
logger.info('User created successfully', user);
```
