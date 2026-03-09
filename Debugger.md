# How and when to use Debugger

## When errors can happen i could be a good ideer to log the error.

```javascript
try {
  // API CALL
} catch (error) {
  debug(`Failed to post data: ${error.message}`, ' error ');
}
```

## Are you interested in how an object looks?

```javascript
const user = {
  id: 123,
  name: 'Anna',
  role: 'admin',
};

info('User object:', user);
```

## Interested in seeing the proces of things happening?

```javascript
info('Starting user creation');
const user = await createUser(userData);
info('User created successfully', user);
```

## Example for use in component

```javascript
      <Button
        label="Upload new floor plan"
        onPress={() => {
          console.log('Button pressed');
          custom('Upload new floor plan button pressed', 'buttons');
        }}
      />
```
