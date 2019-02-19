const mongoose = require("mongoose");
const redis = require("redis");
const keys = require("../config/keys");
const client = redis.createClient(keys.redisUrl);
const util = require("util");

client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || "");

  return this;
};

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );
  console.log(this.hashKey, key);
  //see if we have a value for 'key' in redis
  const cacheValue = await client.hget(this.hashKey, key);
  console.log(cacheValue);

  //if we do, return that
  if (cacheValue) {
    console.log("from cache", cacheValue);
    const doc = JSON.parse(cacheValue);
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  //otherwise, isse query and store the result in redis
  const result = await exec.apply(this, arguments);
  client.hset(this.hashKey, key, JSON.stringify(result), "EX", 10);
  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};
