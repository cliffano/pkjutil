"use strict";
/* eslint no-unused-vars: 0 */
import bag from "bagofcli";
import { program as commander } from "commander";
import referee from "@sinonjs/referee";
import sinon from "sinon";
import cli from "../lib/cli.js";
import PkjUtil from "../lib/pkjutil.js";
const assert = referee.assert;

describe("cli - exec", function () {
  afterEach(function () {
    sinon.restore();
  });

  it("should contain commands with actions", function (done) {
    sinon.stub(bag, "command").value(function (base, actions) {
      assert.isString(base);
      assert.isFunction(actions.commands["list-dependencies"].action);
      assert.isFunction(actions.commands["list-devdependencies"].action);
      assert.isFunction(actions.commands["list-peerdependencies"].action);
      assert.isFunction(actions.commands["list-optdependencies"].action);
      assert.isFunction(actions.commands["list-alldependencies"].action);
      assert.isFunction(actions.commands["set-node-engine"].action);
      assert.isFunction(actions.commands["sort-dependencies"].action);
      assert.isFunction(actions.commands["sort-devdependencies"].action);
      assert.isFunction(actions.commands["sort-peerdependencies"].action);
      assert.isFunction(actions.commands["sort-optdependencies"].action);
      assert.isFunction(actions.commands["sort-alldependencies"].action);
      assert.isFunction(actions.commands["traverse-dependencies"].action);
      assert.isFunction(actions.commands["upgrade-version-patch"].action);
      assert.isFunction(actions.commands["upgrade-version-minor"].action);
      assert.isFunction(actions.commands["upgrade-version-major"].action);
      assert.isFunction(actions.commands["upgrade-version"].action);
      assert.isFunction(actions.commands["upgrade-dependencies"].action);
      done();
    });
    cli.exec();
  });
});

describe("cli - list-*", function () {
  beforeEach(function () {
    sinon.stub(commander, "opts").returns({ file: "somepackage.json" });
    this.mockConsole = sinon.mock(console);
    this.mockProcess = sinon.mock(process);
  });

  afterEach(function () {
    try {
      this.mockConsole.verify();
      this.mockProcess.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should list dependencies", function () {
    this.mockConsole.expects("log").once().withExactArgs("dep1");
    this.mockConsole.expects("log").once().withExactArgs("dep2");
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["list-dependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "listDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "dependencies");
        cb(null, ["dep1", "dep2"]);
      });
    cli.exec();
  });

  it("should list dev dependencies", function () {
    this.mockConsole.expects("log").once().withExactArgs("dep1");
    this.mockConsole.expects("log").once().withExactArgs("dep2");
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["list-devdependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "listDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "devDependencies");
        cb(null, ["dep1", "dep2"]);
      });
    cli.exec();
  });

  it("should list peer dependencies", function () {
    this.mockConsole.expects("log").once().withExactArgs("dep1");
    this.mockConsole.expects("log").once().withExactArgs("dep2");
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["list-peerdependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "listDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "peerDependencies");
        cb(null, ["dep1", "dep2"]);
      });
    cli.exec();
  });

  it("should list opt dependencies", function () {
    this.mockConsole.expects("log").once().withExactArgs("dep1");
    this.mockConsole.expects("log").once().withExactArgs("dep2");
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["list-optdependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "listDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "optDependencies");
        cb(null, ["dep1", "dep2"]);
      });
    cli.exec();
  });

  it("should list all dependencies", function () {
    this.mockConsole.expects("log").once().withExactArgs("dep1");
    this.mockConsole.expects("log").once().withExactArgs("dep2");
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["list-alldependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "listDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.isNull(type);
        cb(null, ["dep1", "dep2"]);
      });
    cli.exec();
  });
});

describe("cli - sort-*", function () {
  beforeEach(function () {
    sinon.stub(commander, "opts").returns({ file: "somepackage.json" });
    this.mockConsole = sinon.mock(console);
    this.mockProcess = sinon.mock(process);

    this.mockConsole.expects("log").once().withExactArgs("Dependencies sorted");
  });

  afterEach(function () {
    try {
      this.mockConsole.verify();
      this.mockProcess.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should sort dependencies", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["sort-dependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "sortDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "dependencies");
        cb(null, {});
      });
    cli.exec();
  });

  it("should sort dev dependencies", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["sort-devdependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "sortDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "devDependencies");
        cb(null, {});
      });
    cli.exec();
  });

  it("should sort peer dependencies", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["sort-peerdependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "sortDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "peerDependencies");
        cb(null, {});
      });
    cli.exec();
  });

  it("should sort opt dependencies", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["sort-optdependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "sortDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "optDependencies");
        cb(null, {});
      });
    cli.exec();
  });

  it("should sort all dependencies", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["sort-alldependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "sortDependencies")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.isNull(type);
        cb(null, {});
      });
    cli.exec();
  });
});

describe("cli - traverse-dependencies", function () {
  beforeEach(function () {
    this.mockConsole = sinon.mock(console);
    this.mockProcess = sinon.mock(process);
  });

  afterEach(function () {
    try {
      this.mockConsole.verify();
      this.mockProcess.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should log packages with their dependencies", function () {
    this.mockConsole.expects("log").once().withExactArgs("* %s", "dep1@0.0.1");
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("  - %s:", "dependencies");
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("    - %s: %s", "subdep1", "0.0.1");
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["traverse-dependencies"].action({});
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "traverseDependencies")
      .callsFake(function (cb) {
        const result = {
          "dep1@0.0.1": {
            dependencies: {
              subdep1: "0.0.1",
            },
          },
        };
        cb(null, result);
      });
    cli.exec();
  });
});

describe("cli - upgrade-version-*", function () {
  beforeEach(function () {
    sinon.stub(commander, "opts").returns({ file: "somepackage.json" });
    this.mockConsole = sinon.mock(console);
    this.mockProcess = sinon.mock(process);
  });

  afterEach(function () {
    try {
      this.mockConsole.verify();
      this.mockProcess.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should pass patch type and log upgraded version when upgrade-version-patch is called", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["upgrade-version-patch"].action({});
    });
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Upgraded version to %s", "0.0.1");
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "upgradeVersion")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "patch");
        cb(null, { version: "0.0.1" });
      });
    cli.exec();
  });

  it("should log the upgraded version only when upgrade-version-patch is called with parsable option", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["upgrade-version-patch"].action({
        parsable: true,
      });
    });
    this.mockConsole.expects("log").once().withExactArgs("0.0.1");
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "upgradeVersion")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "patch");
        cb(null, { version: "0.0.1" });
      });
    cli.exec();
  });

  it("should pass minor type and log upgraded version when upgrade-version-minor is called", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["upgrade-version-minor"].action({});
    });
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Upgraded version to %s", "0.1.0");
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "upgradeVersion")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "minor");
        cb(null, { version: "0.1.0" });
      });
    cli.exec();
  });

  it("should pass major type and log upgraded version when upgrade-version-major is called", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["upgrade-version-major"].action({});
    });
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Upgraded version to %s", "1.0.0");
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "upgradeVersion")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "major");
        cb(null, { version: "1.0.0" });
      });
    cli.exec();
  });

  it("should pass patch type and log upgraded version when upgrade-version alias is called", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["upgrade-version"].action({});
    });
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs("Upgraded version to %s", "0.0.1");
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "upgradeVersion")
      .callsFake(function (type, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(type, "patch");
        cb(null, { version: "0.0.1" });
      });
    cli.exec();
  });
});

describe("cli - upgrade-dependencies", function () {
  beforeEach(function () {
    sinon.stub(commander, "opts").returns({ file: "somepackage.json" });
    this.mockProcess = sinon.mock(process);
  });

  afterEach(function () {
    try {
      this.mockProcess.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should pass file and registry options when upgrade-dependencies is called with registry option", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["upgrade-dependencies"].action({
        registry: "http://someregistry",
      });
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "upgradeDependencies")
      .callsFake(function (opts, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(opts, { registry: "http://someregistry" });
        cb(null);
      });
    cli.exec();
  });
});

describe("cli - set-node-engine", function () {
  beforeEach(function () {
    this.mockProcess = sinon.mock(process);
  });

  afterEach(function () {
    try {
      this.mockProcess.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should pass version and exit when set-node-engine is called", function () {
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["set-node-engine"].action({ args: [">= 4.0"] });
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "setNodeEngine")
      .callsFake(function (version, cb) {
        assert.equals(version, ">= 4.0");
        cb(null);
      });
    cli.exec();
  });

  it("should use the file from global option when file option is specified", function () {
    sinon.stub(commander, "opts").returns({ file: "somepackage.json" });
    sinon.stub(bag, "command").value(function (base, actions) {
      actions.commands["set-node-engine"].action({ args: [">= 4.0"] });
    });
    this.mockProcess.expects("exit").once().withExactArgs(0);
    sinon
      .stub(PkjUtil.prototype, "setNodeEngine")
      .callsFake(function (version, cb) {
        assert.equals(this.file, "somepackage.json");
        assert.equals(version, ">= 4.0");
        cb(null);
      });
    cli.exec();
  });
});
