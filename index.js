const chalk = require("chalk");
const core = require("@actions/core");

const config = {
  highSeverityThreshold: 150, // ms
  mediumServerityTheshold: 75, // ms
  actionsEnabled: false,
};

const slothyTests = [];

function testCompleted(duration, title) {
  if (duration > config.mediumServerityTheshold) {
    const isServere = duration > config.highSeverityThreshold;
    slothyTests.push({
      title,
      duration,
      actionDisplay: isServere ? core.error : core.warning,
      colorDisplay: isServere ? chalk.red : chalk.yellow,
    });
  }
}

function completed() {
  console.log(chalk.bold("Slothy Test Count: %s\n"), slothyTests.length);

  if (slothyTests.length === 0) {
    return;
  }

  const sortSlothyTests = slothyTests.sort((a, b) => {
    return b.duration - a.duration;
  });

  sortSlothyTests.forEach((test) => {
    console.log(test.colorDisplay(`${test.duration} ms`), test.title);
    if (config.actionsEnabled) {
      test.actionDisplay(`${test.duration} ms: ${test.title}`);
    }
  });

  setTimeout(() => {
    process.exit();
  }, 0);
}

function testRunner(runner, options) {
  const { actions, slow } = options;
  const actionsPath = options["reporterOptions.actions"];
  const slowPath = options["reporterOptions.slow"];

  const slowNum = Number(slow);
  if (slow && Number.isInteger(slowNum)) {
    config.mediumServerityTheshold = slowNum;
    config.highSeverityThreshold = slowNum * 2;
  } else {
    throw new Error("Slow variable needs to be an integer");
  }

  const slowPathNum = Number(slowPath);
  if (slowPath && Number.isInteger(slowPathNum)) {
    config.mediumServerityTheshold = slowPathNum;
    config.highSeverityThreshold = slowPathNum * 2;
  } else {
    throw new Error("Slow variable needs to be an integer");
  }

  if (
    actions === "true" ||
    actions === "false" ||
    actions === true ||
    actions === false
  ) {
    config.actionsEnabled = actions === "true";
  } else if (actions !== undefined) {
    throw new Error("Actions needs to be a boolean true/false");
  }

  if (
    actionsPath === "true" ||
    actionsPath === "false" ||
    actionsPath === true ||
    actionsPath === false
  ) {
    config.actionsEnabled = actionsPath === "true";
  } else if (actionsPath !== undefined) {
    throw new Error("Actions needs to be a boolean true/false");
  }

  runner.on("test end", (test) => {
    try {
      testCompleted(test.duration, test.fullTitle());
    } catch (e) {
      console.log(e);
      if (config.actionsEnabled) {
        core.setFailed(e.message);
      }
    }
  });

  runner.on("end", () => {
    try {
      completed();
    } catch (e) {
      console.log(e);
      if (config.actionsEnabled) {
        core.setFailed(e.message);
      }
    }
  });
}

module.exports = testRunner;