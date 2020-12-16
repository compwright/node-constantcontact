# node-constantcontact

[![Dependency Status](https://img.shields.io/david/compwright/node-constantcontact.svg?style=flat-square)](https://david-dm.org/compwright/node-constantcontact)
[![Download Status](https://img.shields.io/npm/dm/node-constantcontact.svg?style=flat-square)](https://www.npmjs.com/package/node-constantcontact)
[![Sponsor on GitHub](https://img.shields.io/static/v1?label=Sponsor&message=❤&logo=GitHub&link=https://github.com/sponsors/compwright)](https://github.com/sponsors/compwright)

Constant Contact v2 API client for Node.js

## Install

```
$ npm install node-constantcontact --save
```

## Usage

### Setup

```javascript
const ConstantContact = require('node-constantcontact');

const cc = new ConstantContact({
  apiKey: '',
  accessToken: ''
});
```
  
### Get list of email campaigns
    
```javascript
let req = cc.campaigns.find({ email: 'some.person@some-domain.com' });

req
  .catch((err) => {})
  .then((result) => {});
```

### Search for existing contact

```javascript
let req = cc.contacts.find({ email: 'test@example.org' });

req
  .catch((err) => {})
  .then((result) => {});
```

### Add new contact

```
let contacts = [
  // array of contact objects - see
  // https://developer.constantcontact.com/docs/contacts-api/contacts-collection.html?method=POST
];

let req = cc.contacts.create(contacts, { action_by: 'ACTION_BY_OWNER' });

req
  .catch((err) => {})
  .then((result) => {});
```

### Update existing contact

```javascript
let req = cc.contacts.save(contact, { action_by: 'ACTION_BY_OWNER '});

req
  .catch((err) => {})
  .then((result) => {});
```

## Advanced Usage

### cc.client

Returns the internal instance of [purest](https://npmjs.com/package/purest) configured for Constant Contact.

```javascript
let req = cc.client.get('activities').qs({ status: 'ERROR' }).request();

req
  .catch((err) => {})
  .then((result) => {});
```

### cc.paginate(requestPromise, onPageLoad, onError, onEnd)

Follows the pagination links in a request to load each page sequentially.

```javascript
cc.paginate(
  cc.contacts.find(),
  (page) => {},
  (err) => {},
  () => {}
);
```

### cc.bulkWait(id, interval)

Waits for a bulk operation to complete.

## Constant Contact API documentation

* https://constantcontact.mashery.com/io-docs
* http://developer.constantcontact.com/docs/developer-guides/api-documentation-index.html
