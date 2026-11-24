"use strict";
import esmock from "esmock";
import fs from "fs";
import referee from "@sinonjs/referee";
import req from "bagofrequest";
import sinon from "sinon";
import PkjUtil from "../lib/pkjutil.js";
const assert = referee.assert;

describe("pkjutil - listDependencies", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
    this.pkjUtil = new PkjUtil();
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(
        1,
        null,
        '{"dependencies": { "dep1": "0.0.1", "dep2": "0.0.2", "shareddep": "0.0.1" }, "devDependencies": { "devdep1": "0.0.1", "shareddep": "0.0.1" }}',
      );
  });

  afterEach(function () {
    this.mockFs.verify();
    sinon.restore();
  });

  it("should pass dependency module names when type is dependencies", function (done) {
    this.pkjUtil.listDependencies("dependencies", function (err, deps) {
      assert.isNull(err);
      assert.equals(deps, ["dep1", "dep2", "shareddep"]);
      done();
    });
  });

  it("should pass dev dependency module names when type is devDependencies", function (done) {
    this.pkjUtil.listDependencies("devDependencies", function (err, deps) {
      assert.isNull(err);
      assert.equals(deps, ["devdep1", "shareddep"]);
      done();
    });
  });

  it("should pass all dependency types module names when type is null", function (done) {
    this.pkjUtil.listDependencies(null, function (err, deps) {
      assert.isNull(err);
      assert.equals(deps, ["dep1", "dep2", "shareddep", "devdep1"]);
      done();
    });
  });
});

describe("pkjutil - setNodeEngine", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
    this.pkjUtil = new PkjUtil();
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"engines": { "node": "> 1.0.0"}}');
    this.mockFs.expects("writeFile").once().callsArgWith(2, null);
  });

  afterEach(function () {
    this.mockFs.verify();
    sinon.restore();
  });

  it("should set node engine value", function (done) {
    this.pkjUtil.setNodeEngine(">= 4.0.0", function (err, pkg) {
      assert.isNull(err);
      assert.equals(JSON.stringify(pkg.engines), '{"node":">= 4.0.0"}');
      done();
    });
  });
});

describe("pkjutil - sortDependencies", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
    this.pkjUtil = new PkjUtil();
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(
        1,
        null,
        '{"dependencies": { "bdep1": "0.0.1", "adep2": "0.0.2", "cdep": "0.0.1" }, "devDependencies": { "zdep1": "0.0.1", "cdep": "0.0.1" }}',
      );
    this.mockFs.expects("writeFile").once().callsArgWith(2, null);
  });

  afterEach(function () {
    this.mockFs.verify();
    sinon.restore();
  });

  it("should sort dependency module names when type is dependencies", function (done) {
    this.pkjUtil.sortDependencies("dependencies", function (err, pkg) {
      assert.isNull(err);
      assert.equals(
        JSON.stringify(pkg.dependencies),
        '{"adep2":"0.0.2","bdep1":"0.0.1","cdep":"0.0.1"}',
      );
      done();
    });
  });

  it("should pass dev dependency module names when type is devDependencies", function (done) {
    this.pkjUtil.sortDependencies("devDependencies", function (err, pkg) {
      assert.isNull(err);
      assert.equals(
        JSON.stringify(pkg.devDependencies),
        '{"cdep":"0.0.1","zdep1":"0.0.1"}',
      );
      done();
    });
  });

  it("should sort all dependency types module names when type is null", function (done) {
    this.pkjUtil.sortDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(
        JSON.stringify(pkg.dependencies),
        '{"adep2":"0.0.2","bdep1":"0.0.1","cdep":"0.0.1"}',
      );
      assert.equals(
        JSON.stringify(pkg.devDependencies),
        '{"cdep":"0.0.1","zdep1":"0.0.1"}',
      );
      done();
    });
  });
});

describe("pkjutil - traverseDependencies", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
  });

  afterEach(function () {
    this.mockFs.verify();
    sinon.restore();
  });

  it("should pass error when prod load gets an error", async function () {
    this.mockFs
      .expects("existsSync")
      .once()
      .withArgs("package.json")
      .returns(true);
    const PkjUtilMocked = await esmock("../lib/pkjutil.js", {
      prod: () => ({
        load: function (cb) {
          cb(new Error("some error"));
        },
      }),
    });
    const pkjUtil = new PkjUtilMocked();
    await new Promise((resolve) => {
      pkjUtil.traverseDependencies(function (err, result) {
        assert.equals(err.message, "some error");
        assert.isUndefined(result);
        resolve();
      });
    });
  });

  it("should format dependencies result", async function () {
    this.mockFs
      .expects("existsSync")
      .once()
      .withArgs("package.json")
      .returns(true);
    const PkjUtilMocked = await esmock("../lib/pkjutil.js", {
      prod: () => ({
        load: function (cb) {
          const dependencies = [
            {
              name: "dep1",
              version: "0.0.1",
              _dependencies: {
                subdep: "1.0.0",
              },
              devDependencies: {
                subdevdep: "2.0.0",
              },
              peerDependencies: {
                subpeerdep: "3.0.0",
              },
              foo: "bar",
            },
          ];
          cb(null, dependencies);
        },
      }),
    });
    const pkjUtil = new PkjUtilMocked();

    await new Promise((resolve) => {
      pkjUtil.traverseDependencies(function (err, result) {
        assert.isNull(err);

        const dep = result["dep1@0.0.1"];
        assert.isObject(dep);
        assert.equals(dep.dependencies.subdep, "1.0.0");
        assert.equals(dep.devDependencies.subdevdep, "2.0.0");
        assert.equals(dep.peerDependencies.subpeerdep, "3.0.0");
        resolve();
      });
    });
  });

  it("should pass error to callback when neither package.json nor node_modules exist", function (done) {
    this.mockFs
      .expects("existsSync")
      .once()
      .withArgs("package.json")
      .returns(false);
    this.mockFs
      .expects("existsSync")
      .once()
      .withArgs("node_modules")
      .returns(false);
    const pkjUtil = new PkjUtil();
    pkjUtil.traverseDependencies(function (err) {
      assert.equals(
        err.message,
        "Either package.json file or node_modules directory must exist",
      );
      done();
    });
  });
});

describe("pkjutil - upgradeVersion", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
    this.pkjUtil = new PkjUtil();
  });

  afterEach(function () {
    this.mockFs.verify();
    sinon.restore();
  });

  it("should pass error to callback when an error occurs while reading package file", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, new Error("some error"));
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.equals(err.message, "some error");
      assert.isUndefined(pkg);
      done();
    });
  });

  it("should pass error to callback when an error occurs while writing package file", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs("package.json", '{\n  "version": "9.8.2"\n}')
      .callsArgWith(2, new Error("some error"));
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.equals(err.message, "some error");
      assert.equals(pkg.version, "9.8.2");
      done();
    });
  });

  it("should upgrade patch number when type is not specified", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs("package.json", '{\n  "version": "9.8.2"\n}')
      .callsArgWith(2, null);
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, "9.8.2");
      done();
    });
  });

  it("should upgrade patch number when type is patch", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs("package.json", '{\n  "version": "9.8.2"\n}')
      .callsArgWith(2, null);
    this.pkjUtil.upgradeVersion("patch", function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, "9.8.2");
      done();
    });
  });

  it("should upgrade minor number and reset patch to 0 when type is minor", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs("package.json", '{\n  "version": "9.9.0"\n}')
      .callsArgWith(2, null);
    this.pkjUtil.upgradeVersion("minor", function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, "9.9.0");
      done();
    });
  });

  it("should upgrade major number and reset minor and patch to 0 when type is major", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs("package.json", '{\n  "version": "10.0.0"\n}')
      .callsArgWith(2, null);
    this.pkjUtil.upgradeVersion("major", function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, "10.0.0");
      done();
    });
  });

  it("should keep prerelease detail when upgrading a version", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"version":"9.8.1-pre"}');
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs("package.json", '{\n  "version": "9.8.2-pre"\n}')
      .callsArgWith(2, null);
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.version, "9.8.2-pre");
      done();
    });
  });
});

describe("pkjutil - upgradeDependencies", function () {
  beforeEach(function () {
    this.mockConsole = sinon.mock(console);
    this.mockFs = sinon.mock(fs);
    this.pkjUtil = new PkjUtil();
  });

  afterEach(function () {
    this.mockConsole.verify();
    this.mockFs.verify();
    sinon.restore();
  });

  it("should set all deps to latest version and log messages", function (done) {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - upgraded to %s",
        "dep1".green,
        "dependencies",
        "0.0.2",
      );
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - upgraded to %s",
        "dep1".green,
        "devDependencies",
        "0.0.2",
      );
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - already latest %s",
        "dep2".grey,
        "dependencies",
        "0.0.2",
      );
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - already latest %s",
        "dep2".grey,
        "peerDependencies",
        "0.0.2",
      );
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - already latest %s",
        "dep2".grey,
        "optDependencies",
        "0.0.2",
      );

    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(
        1,
        null,
        '{"dependencies":{"dep1":"0.0.1","dep2":"0.0.2"},"devDependencies":{"dep1":"0.0.1"},"peerDependencies":{"dep2":"0.0.2"},"optDependencies":{"dep2":"0.0.2"}}',
      );
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs(
        "package.json",
        '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  },\n  "devDependencies": {\n    "dep1": "0.0.2"\n  },\n  "peerDependencies": {\n    "dep2": "0.0.2"\n  },\n  "optDependencies": {\n    "dep2": "0.0.2"\n  }\n}',
      )
      .callsArgWith(2, null);

    sinon.stub(req, "request").callsFake(function (method, url, opts, cb) {
      assert.equals(method, "get");
      let body;
      if (url === "https://registry.npmjs.org/dep1/latest") {
        body = '{"version":"0.0.2"}';
      } else if (url === "https://registry.npmjs.org/dep2/latest") {
        body = '{"version":"0.0.2"}';
      }
      opts.handlers[200]({ statusCode: 200, body: body }, cb);
    });

    this.pkjUtil.upgradeDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.dependencies.dep1, "0.0.2");
      assert.equals(pkg.dependencies.dep2, "0.0.2");
      done();
    });
  });

  it("should pass error to callback when upgrade dependencies fail", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(
        1,
        null,
        '{"dependencies":{"dep1":"0.0.1","dep2":"0.0.2"}}',
      );

    sinon.stub(req, "request").callsFake(function (method, url, opts, cb) {
      assert.equals(method, "get");
      cb(new Error("some error"));
    });

    this.pkjUtil.upgradeDependencies(null, function (err) {
      assert.equals(err.message, "some error");
      done();
    });
  });

  it("should add trailing slash when custom registry does not have trailing slash", function (done) {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - upgraded to %s",
        "dep1".green,
        "dependencies",
        "0.0.2",
      );
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - already latest %s",
        "dep2".grey,
        "dependencies",
        "0.0.2",
      );

    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(
        1,
        null,
        '{"dependencies":{"dep1":"0.0.1","dep2":"0.0.2"}}',
      );
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs(
        "package.json",
        '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  }\n}',
      )
      .callsArgWith(2, null);

    sinon.stub(req, "request").callsFake(function (method, url, opts, cb) {
      assert.equals(method, "get");
      let body;
      if (url === "http://someregistry/dep1/latest") {
        body = '{"version":"0.0.2"}';
      } else if (url === "http://someregistry/dep2/latest") {
        body = '{"version":"0.0.2"}';
      }
      opts.handlers[200]({ statusCode: 200, body: body }, cb);
    });

    this.pkjUtil.upgradeDependencies(
      { registry: "http://someregistry" },
      function (err, pkg) {
        assert.isNull(err);
        assert.equals(pkg.dependencies.dep1, "0.0.2");
        assert.equals(pkg.dependencies.dep2, "0.0.2");
        done();
      },
    );
  });

  it("should keep version range", function (done) {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - upgraded to %s",
        "dep1".green,
        "dependencies",
        ">=0.0.2",
      );
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - already latest %s",
        "dep2".grey,
        "dependencies",
        "~0.0.2",
      );

    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(
        1,
        null,
        '{"dependencies":{"dep1":">=0.0.1","dep2":"~0.0.2"}}',
      );
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs(
        "package.json",
        '{\n  "dependencies": {\n    "dep1": ">=0.0.2",\n    "dep2": "~0.0.2"\n  }\n}',
      )
      .callsArgWith(2, null);

    sinon.stub(req, "request").callsFake(function (method, url, opts, cb) {
      assert.equals(method, "get");
      let body;
      if (url === "https://registry.npmjs.org/dep1/latest") {
        body = '{"version":"0.0.2"}';
      } else if (url === "https://registry.npmjs.org/dep2/latest") {
        body = '{"version":"0.0.2"}';
      }
      opts.handlers[200]({ statusCode: 200, body: body }, cb);
    });

    this.pkjUtil.upgradeDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.dependencies.dep1, ">=0.0.2");
      assert.equals(pkg.dependencies.dep2, "~0.0.2");
      done();
    });
  });

  it("should upgrade wildcards to latest version", function (done) {
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - upgraded to %s",
        "dep1".green,
        "dependencies",
        "0.0.2",
      );
    this.mockConsole
      .expects("log")
      .once()
      .withExactArgs(
        "%s - %s - upgraded to %s",
        "dep2".green,
        "dependencies",
        "0.0.2",
      );

    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"dependencies":{"dep1":"1.x.x","dep2":"*"}}');
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs(
        "package.json",
        '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  }\n}',
      )
      .callsArgWith(2, null);

    sinon.stub(req, "request").callsFake(function (method, url, opts, cb) {
      assert.equals(method, "get");
      let body;
      if (url === "https://registry.npmjs.org/dep1/latest") {
        body = '{"version":"0.0.2"}';
      } else if (url === "https://registry.npmjs.org/dep2/latest") {
        body = '{"version":"0.0.2"}';
      }
      opts.handlers[200]({ statusCode: 200, body: body }, cb);
    });

    this.pkjUtil.upgradeDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.dependencies.dep1, "0.0.2");
      assert.equals(pkg.dependencies.dep2, "0.0.2");
      done();
    });
  });

  it("should do nothing when package.json does not specify dependencies, devDependencies, peerDependencies field", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, "{}");
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs("package.json", "{}")
      .callsArgWith(2, null);

    this.pkjUtil.upgradeDependencies(null, function (err, pkg) {
      assert.isNull(err);
      assert.isUndefined(pkg.dependencies);
      assert.isUndefined(pkg.devDependencies);
      assert.isUndefined(pkg.peerDependencies);
      done();
    });
  });
});
