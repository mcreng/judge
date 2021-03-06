const { pointMatchLoss } = require("./pointwise.js");
const { WrongInputFormat } = require("../error");
const logger = require("../../../logger")("socket");

/**
 * @param {string} pred Output from user's code
 * @param {string} exp Expected output
 * @param {string} type question type, could be "IO" or "IOPointwise"
 * @param {number} maxScore maximum score
 * @return {number} score
 */
const evaluate = (pred, exp, type, maxScore) => {
  pred = pred.replace(/\s+$/, "");
  switch (type) {
    case "IOPointwise":
      if (!pred.match(/(\d+)( \d+(.\d+)?)*/)) {
        logger.info("Submission has wrong format.");
        throw new WrongInputFormat();
      }
      pred = pred.split(" "); // split by space

      if (Number(pred[0]) != (pred.length - 1) / 2) {
        throw new WrongInputFormat();
      }

      pred = pred
        .splice(1) // remove the first element since it represents the number of points
        .reduce((resultArray, item, index) => {
          // group by twos
          const chunkIndex = Math.floor(index / 2);
          if (!resultArray[chunkIndex]) resultArray[chunkIndex] = [];
          resultArray[chunkIndex].push(item);
          return resultArray;
        }, []);
      exp = exp
        .split(" ")
        .splice(1)
        .reduce((resultArray, item, index) => {
          const chunkIndex = Math.floor(index / 2);
          if (!resultArray[chunkIndex]) resultArray[chunkIndex] = [];
          resultArray[chunkIndex].push(item);
          return resultArray;
        }, []);
      return pointMatchLoss(pred, exp, maxScore) || 0;
    default:
      return { score: (pred == exp) * maxScore };
  }
};

module.exports = evaluate;
