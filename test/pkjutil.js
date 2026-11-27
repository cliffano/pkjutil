"use strict";
import fs from "fs";
import referee from "@sinonjs/referee";
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
    try {
      this.mockFs.verify();
    } finally {
      sinon.restore();
    }
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

describe("pkjutil - listDependencies error", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
    this.pkjUtil = new PkjUtil("missing.json");
  });

  afterEach(function () {
    try {
      this.mockFs.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should pass error to callback when an error occurs while reading package file", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("missing.json")
      .callsArgWith(1, new Error("someerror"));
    this.pkjUtil.listDependencies("dependencies", function (err, deps) {
      assert.equals(err.message, "someerror");
      assert.isUndefined(deps);
      done();
    });
  });

  it("should pass error to callback when package file contains invalid JSON", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("missing.json")
      .callsArgWith(1, null, '{"dependencies": ');
    this.pkjUtil.listDependencies("dependencies", function (err, deps) {
      assert.match(err.message, /^Unable to parse missing.json: /);
      assert.isUndefined(deps);
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
    try {
      this.mockFs.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should set node engine value", function (done) {
    this.pkjUtil.setNodeEngine(">= 4.0.0", function (err, pkg) {
      assert.isNull(err);
      assert.equals(JSON.stringify(pkg.engines), '{"node":">= 4.0.0"}');
      done();
    });
  });
});

describe("pkjutil - setNodeEngine engines field", function () {
  beforeEach(function () {
    this.mockFs = sinon.mock(fs);
    this.pkjUtil = new PkjUtil();
    this.mockFs.expects("writeFile").once().callsArgWith(2, null);
  });

  afterEach(function () {
    try {
      this.mockFs.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should add engines field with node engine value when engines field does not exist", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"name": "somename"}');
    this.pkjUtil.setNodeEngine(">= 4.0.0", function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.engines, { node: ">= 4.0.0" });
      done();
    });
  });

  it("should keep other engines values when setting node engine value", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(
        1,
        null,
        '{"engines": { "node": "> 1.0.0", "npm": ">= 10.0.0" }}',
      );
    this.pkjUtil.setNodeEngine(">= 4.0.0", function (err, pkg) {
      assert.isNull(err);
      assert.equals(pkg.engines, { node: ">= 4.0.0", npm: ">= 10.0.0" });
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
    try {
      this.mockFs.verify();
    } finally {
      sinon.restore();
    }
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
    try {
      this.mockFs.verify();
    } finally {
      sinon.restore();
    }
  });

  it("should pass error to callback when reading installed packages fails", function (done) {
    this.mockFs
      .expects("existsSync")
      .once()
      .withArgs("package.json")
      .returns(true);
    sinon
      .stub(PkjUtil.prototype, "_readInstalled")
      .callsFake(function (dir, cb) {
        assert.equals(dir, process.cwd());
        cb(new Error("some error"));
      });
    new PkjUtil().traverseDependencies(function (err, result) {
      assert.equals(err.message, "some error");
      assert.isUndefined(result);
      done();
    });
  });

  it("should format dependencies result when installed packages are read", function (done) {
    this.mockFs
      .expects("existsSync")
      .once()
      .withArgs("package.json")
      .returns(true);
    sinon
      .stub(PkjUtil.prototype, "_readInstalled")
      .callsFake(function (dir, cb) {
        cb(null, [
          {
            name: "dep1",
            version: "0.0.1",
            dependencies: { subdep: "1.0.0" },
            optionalDependencies: { suboptionaldep: "1.1.0" },
            devDependencies: { subdevdep: "2.0.0" },
            peerDependencies: { subpeerdep: "3.0.0" },
            optDependencies: { suboptdep: "4.0.0" },
            foo: "bar",
          },
          { name: "dep2", version: "0.0.2", dependencies: {} },
        ]);
      });
    new PkjUtil().traverseDependencies(function (err, result) {
      assert.isNull(err);
      assert.equals(result, {
        "dep1@0.0.1": {
          dependencies: { subdep: "1.0.0", suboptionaldep: "1.1.0" },
          devDependencies: { subdevdep: "2.0.0" },
          peerDependencies: { subpeerdep: "3.0.0" },
          optDependencies: { suboptdep: "4.0.0" },
        },
        "dep2@0.0.2": {},
      });
      done();
    });
  });

  it("should read installed packages when only node_modules exists", function (done) {
    this.mockFs
      .expects("existsSync")
      .once()
      .withArgs("package.json")
      .returns(false);
    this.mockFs
      .expects("existsSync")
      .once()
      .withArgs("node_modules")
      .returns(true);
    sinon
      .stub(PkjUtil.prototype, "_readInstalled")
      .callsFake(function (dir, cb) {
        cb(null, []);
      });
    new PkjUtil().traverseDependencies(function (err, result) {
      assert.isNull(err);
      assert.equals(result, {});
      done();
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

describe("pkjutil - _readInstalled", function () {
  // Fake filesystem: dirs map to entry names, files map to contents,
  // links map a path to its real path, errors map a path to an error code.
  function fakeFs(tree) {
    function fsError(code) {
      const err = new Error(code);
      err.code = code;
      return err;
    }
    sinon.stub(fs, "realpath").callsFake(function (path, cb) {
      if (tree.errors && tree.errors[path]) {
        cb(fsError(tree.errors[path]));
      } else {
        cb(null, (tree.links && tree.links[path]) || path);
      }
    });
    sinon.stub(fs, "readdir").callsFake(function (path, cb) {
      if (tree.errors && tree.errors[path]) {
        cb(fsError(tree.errors[path]));
      } else if (tree.dirs[path]) {
        cb(null, tree.dirs[path]);
      } else {
        cb(fsError(tree.files[path] !== undefined ? "ENOTDIR" : "ENOENT"));
      }
    });
    sinon.stub(fs, "readFile").callsFake(function (path, encoding, cb) {
      assert.equals(encoding, "utf8");
      if (tree.errors && tree.errors[path]) {
        cb(fsError(tree.errors[path]));
      } else if (tree.files[path] !== undefined) {
        cb(null, tree.files[path]);
      } else {
        cb(fsError("ENOENT"));
      }
    });
  }

  function pkgJson(name, version) {
    return JSON.stringify({ name: name, version: version });
  }

  function names(pkgs) {
    return pkgs.map(function (pkg) {
      return pkg.name + "@" + pkg.version;
    });
  }

  afterEach(function () {
    sinon.restore();
  });

  it("should read root, top level, scoped, and nested packages when they are installed", function (done) {
    fakeFs({
      dirs: {
        "/app/node_modules": [".bin", ".package-lock.json", "a", "@scope"],
        "/app/node_modules/@scope": ["b", ".hidden"],
        "/app/node_modules/a/node_modules": ["c"],
      },
      files: {
        "/app/package.json": pkgJson("app", "1.0.0"),
        "/app/node_modules/a/package.json": pkgJson("a", "1.1.0"),
        "/app/node_modules/@scope/b/package.json": pkgJson("@scope/b", "2.0.0"),
        "/app/node_modules/a/node_modules/c/package.json": pkgJson(
          "c",
          "3.0.0",
        ),
      },
    });
    new PkjUtil()._readInstalled("/app", function (err, pkgs) {
      assert.isNull(err);
      assert.equals(names(pkgs), [
        "app@1.0.0",
        "a@1.1.0",
        "c@3.0.0",
        "@scope/b@2.0.0",
      ]);
      done();
    });
  });

  it("should read a package once when it is reachable via a symlink", function (done) {
    fakeFs({
      dirs: {
        "/app/node_modules": ["a", "b"],
        "/app/node_modules/b/node_modules": ["a"],
      },
      links: {
        "/app/node_modules/b/node_modules/a": "/app/node_modules/a",
      },
      files: {
        "/app/package.json": pkgJson("app", "1.0.0"),
        "/app/node_modules/a/package.json": pkgJson("a", "1.0.0"),
        "/app/node_modules/b/package.json": pkgJson("b", "1.0.0"),
      },
    });
    new PkjUtil()._readInstalled("/app", function (err, pkgs) {
      assert.isNull(err);
      assert.equals(names(pkgs), ["app@1.0.0", "a@1.0.0", "b@1.0.0"]);
      done();
    });
  });

  it("should skip directories and files without package.json when they are in node_modules", function (done) {
    fakeFs({
      dirs: {
        "/app/node_modules": ["nopkg", "somefile", "a"],
        "/app/node_modules/nopkg": [],
      },
      files: {
        "/app/node_modules/somefile": "not a package",
        "/app/node_modules/a/package.json": pkgJson("a", "1.0.0"),
      },
    });
    new PkjUtil()._readInstalled("/app", function (err, pkgs) {
      assert.isNull(err);
      assert.equals(names(pkgs), ["a@1.0.0"]);
      done();
    });
  });

  it("should pass error to callback when a package.json contains invalid JSON", function (done) {
    fakeFs({
      dirs: { "/app/node_modules": ["a"] },
      files: {
        "/app/package.json": pkgJson("app", "1.0.0"),
        "/app/node_modules/a/package.json": '{"name": ',
      },
    });
    new PkjUtil()._readInstalled("/app", function (err, pkgs) {
      assert.match(
        err.message,
        /^Unable to parse \/app\/node_modules\/a\/package.json: /,
      );
      assert.isUndefined(pkgs);
      done();
    });
  });

  it("should pass error to callback when reading node_modules fails", function (done) {
    fakeFs({
      dirs: {},
      files: { "/app/package.json": pkgJson("app", "1.0.0") },
      errors: { "/app/node_modules": "EACCES" },
    });
    new PkjUtil()._readInstalled("/app", function (err) {
      assert.equals(err.code, "EACCES");
      done();
    });
  });

  it("should pass error to callback when reading a scope directory fails", function (done) {
    fakeFs({
      dirs: { "/app/node_modules": ["@scope"] },
      files: { "/app/package.json": pkgJson("app", "1.0.0") },
      errors: { "/app/node_modules/@scope": "EACCES" },
    });
    new PkjUtil()._readInstalled("/app", function (err) {
      assert.equals(err.code, "EACCES");
      done();
    });
  });

  it("should pass error to callback when reading a package.json fails", function (done) {
    fakeFs({
      dirs: {},
      files: {},
      errors: { "/app/package.json": "EACCES" },
    });
    new PkjUtil()._readInstalled("/app", function (err) {
      assert.equals(err.code, "EACCES");
      done();
    });
  });

  it("should pass error to callback when resolving a real path fails", function (done) {
    fakeFs({
      dirs: {},
      files: {},
      errors: { "/app": "ELOOP" },
    });
    new PkjUtil()._readInstalled("/app", function (err) {
      assert.equals(err.code, "ELOOP");
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
    try {
      this.mockFs.verify();
    } finally {
      sinon.restore();
    }
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

  it("should pass error to callback and not write package file when package file contains invalid JSON", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"version": "9.8.1",}');
    this.mockFs.expects("writeFile").never();
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.match(err.message, /^Unable to parse package.json: /);
      assert.isUndefined(pkg);
      done();
    });
  });

  it("should write package file with trailing newline when upgrading version", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"version":"9.8.1"}');
    this.mockFs
      .expects("writeFile")
      .once()
      .withArgs(
        "package.json",
        sinon.match(function (data) {
          return data.endsWith("}\n");
        }, "ends with trailing newline"),
      )
      .callsArgWith(2, null);
    this.pkjUtil.upgradeVersion(null, function (err, pkg) {
      assert.isNull(err);
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
      .withArgs("package.json", '{\n  "version": "9.8.2"\n}\n')
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
      .withArgs("package.json", '{\n  "version": "9.8.2"\n}\n')
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
      .withArgs("package.json", '{\n  "version": "9.8.2"\n}\n')
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
      .withArgs("package.json", '{\n  "version": "9.9.0"\n}\n')
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
      .withArgs("package.json", '{\n  "version": "10.0.0"\n}\n')
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
      .withArgs("package.json", '{\n  "version": "9.8.2-pre"\n}\n')
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
    try {
      this.mockConsole.verify();
      this.mockFs.verify();
    } finally {
      sinon.restore();
    }
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
        '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  },\n  "devDependencies": {\n    "dep1": "0.0.2"\n  },\n  "peerDependencies": {\n    "dep2": "0.0.2"\n  },\n  "optDependencies": {\n    "dep2": "0.0.2"\n  }\n}\n',
      )
      .callsArgWith(2, null);

    sinon.stub(PkjUtil.prototype, "_httpGet").callsFake(function (url, cb) {
      let body;
      if (url === "https://registry.npmjs.org/dep1/latest") {
        body = '{"version":"0.0.2"}';
      } else if (url === "https://registry.npmjs.org/dep2/latest") {
        body = '{"version":"0.0.2"}';
      }
      cb(null, body);
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

    sinon.stub(PkjUtil.prototype, "_httpGet").callsFake(function (url, cb) {
      cb(new Error("some error"));
    });

    this.pkjUtil.upgradeDependencies(null, function (err) {
      assert.equals(err.message, "some error");
      done();
    });
  });

  it("should pass error to callback when registry response is not valid JSON", function (done) {
    this.mockFs
      .expects("readFile")
      .once()
      .withArgs("package.json")
      .callsArgWith(1, null, '{"dependencies":{"dep1":"0.0.1"}}');
    this.mockFs.expects("writeFile").never();

    sinon.stub(PkjUtil.prototype, "_httpGet").callsFake(function (url, cb) {
      cb(null, "<html>not json</html>");
    });

    this.pkjUtil.upgradeDependencies(null, function (err) {
      assert.match(
        err.message,
        /^Unable to parse registry response for dep1: /,
      );
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
        '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  }\n}\n',
      )
      .callsArgWith(2, null);

    sinon.stub(PkjUtil.prototype, "_httpGet").callsFake(function (url, cb) {
      let body;
      if (url === "http://someregistry/dep1/latest") {
        body = '{"version":"0.0.2"}';
      } else if (url === "http://someregistry/dep2/latest") {
        body = '{"version":"0.0.2"}';
      }
      cb(null, body);
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
        '{\n  "dependencies": {\n    "dep1": ">=0.0.2",\n    "dep2": "~0.0.2"\n  }\n}\n',
      )
      .callsArgWith(2, null);

    sinon.stub(PkjUtil.prototype, "_httpGet").callsFake(function (url, cb) {
      let body;
      if (url === "https://registry.npmjs.org/dep1/latest") {
        body = '{"version":"0.0.2"}';
      } else if (url === "https://registry.npmjs.org/dep2/latest") {
        body = '{"version":"0.0.2"}';
      }
      cb(null, body);
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
        '{\n  "dependencies": {\n    "dep1": "0.0.2",\n    "dep2": "0.0.2"\n  }\n}\n',
      )
      .callsArgWith(2, null);

    sinon.stub(PkjUtil.prototype, "_httpGet").callsFake(function (url, cb) {
      let body;
      if (url === "https://registry.npmjs.org/dep1/latest") {
        body = '{"version":"0.0.2"}';
      } else if (url === "https://registry.npmjs.org/dep2/latest") {
        body = '{"version":"0.0.2"}';
      }
      cb(null, body);
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
      .withArgs("package.json", "{}\n")
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

describe("pkjutil - _httpGet", function () {
  beforeEach(function () {
    this.pkjUtil = new PkjUtil();
  });

  afterEach(function () {
    sinon.restore();
  });

  function response(status, body) {
    return {
      status: status,
      text: function () {
        return Promise.resolve(body);
      },
    };
  }

  it("should pass response body to callback when status code is 200", function (done) {
    const stub = sinon
      .stub(globalThis, "fetch")
      .resolves(response(200, '{"version":"1.2.3"}'));
    this.pkjUtil._httpGet(
      "https://someregistry/dep1/latest",
      function (err, body) {
        assert.isNull(err);
        assert.equals(body, '{"version":"1.2.3"}');
        assert.equals(
          stub.firstCall.args[0],
          "https://someregistry/dep1/latest",
        );
        assert.equals(stub.firstCall.args[1].headers, {});
        assert.isTrue(stub.firstCall.args[1].signal instanceof AbortSignal);
        done();
      },
    );
  });

  it("should pass error with status code and body to callback when status code is not 200", function (done) {
    sinon.stub(globalThis, "fetch").resolves(response(404, "Not found"));
    this.pkjUtil._httpGet(
      "https://someregistry/dep1/latest",
      function (err, body) {
        assert.equals(
          err.message,
          "Unexpected status code: 404\nResponse body:\nNot found",
        );
        assert.isUndefined(body);
        done();
      },
    );
  });

  it("should pass error cause to callback when fetch fails with a network error", function (done) {
    const cause = new Error("getaddrinfo ENOTFOUND someregistry");
    const err = new TypeError("fetch failed");
    err.cause = cause;
    sinon.stub(globalThis, "fetch").rejects(err);
    this.pkjUtil._httpGet("https://someregistry/dep1/latest", function (err) {
      assert.equals(err.message, "getaddrinfo ENOTFOUND someregistry");
      done();
    });
  });

  it("should pass error to callback when fetch fails without a cause", function (done) {
    sinon.stub(globalThis, "fetch").rejects(new Error("some error"));
    this.pkjUtil._httpGet("https://someregistry/dep1/latest", function (err) {
      assert.equals(err.message, "some error");
      done();
    });
  });

  it("should send credentials as basic authorization header when URL contains credentials", function (done) {
    const stub = sinon.stub(globalThis, "fetch").resolves(response(200, "{}"));
    this.pkjUtil._httpGet(
      "http://some%40user:some%3Apass@someregistry:8080/dep1/latest",
      function (err) {
        assert.isNull(err);
        assert.equals(
          stub.firstCall.args[0],
          "http://someregistry:8080/dep1/latest",
        );
        assert.equals(stub.firstCall.args[1].headers, {
          Authorization:
            "Basic " + Buffer.from("some@user:some:pass").toString("base64"),
        });
        done();
      },
    );
  });

  it("should call back only once when callback throws an error", function (done) {
    sinon.stub(globalThis, "fetch").resolves(response(200, "{}"));
    let calls = 0;
    const listeners = process.listeners("uncaughtException");
    process.removeAllListeners("uncaughtException");
    process.once("uncaughtException", function (err) {
      listeners.forEach(function (listener) {
        process.on("uncaughtException", listener);
      });
      assert.equals(err.message, "callback error");
      setImmediate(function () {
        assert.equals(calls, 1);
        done();
      });
    });
    this.pkjUtil._httpGet("https://someregistry/dep1/latest", function () {
      calls++;
      throw new Error("callback error");
    });
  });
});
