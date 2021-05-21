const mongoose = require("mongoose");
const redis = require("redis");
const { promisify } = require("util");
const keys = require("../config/keys");

const client = redis.createClient(keys.redisUrl);

client.hget = promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.toCache = true;
  this.hashKey = JSON.stringify(options.key || "");

  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.toCache) {
    return exec.apply(this, arguments);
  }

  const cacheKey = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );

  const cachedData = await client.hget(this.hashKey, cacheKey);

  if (cachedData) {
    console.log("used cache");
    const parsedData = JSON.parse(cachedData);

    return Array.isArray(parsedData)
      ? parsedData.map((d) => new this.model(d))
      : new this.model(d);
  }

  const doc = await exec.apply(this, arguments);

  client.hset(this.hashKey, cacheKey, JSON.stringify(doc), "EX", 60);

  return doc;
};

module.exports = {
  clearCache(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
