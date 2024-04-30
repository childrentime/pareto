const fs = require("fs-extra");
const { SERVER_ENTRY_PATH } = require("../../../constant");

const escape = (path) =>
  path.replace(/\\/g, "\\\\").replace(/\//g, "\\/").replace(/\./g, "\\.");

// import 改为 const
const clearEntryContent = (filePath) => {
  const entryContent = fs.readFileSync(SERVER_ENTRY_PATH).toString();
  const reg = new RegExp(
    "(?:^|\n)(import\\s+(\\w+)\\s+from\\s+'" +
      escape(filePath) +
      "';)",
    "g"
  );
  fs.writeFileSync(
    SERVER_ENTRY_PATH,
    entryContent.replace(reg, (all, main, name) => {
      return `\n// ${main}\nconst ${name} = {};`;
    })
  );
};


// import 注释恢复 删除const
const recoverEntryContent = (filePath) => {
  const entryContent = fs.readFileSync(SERVER_ENTRY_PATH).toString();
  // 匹配import语句中的别名
  const reg = new RegExp(
    "\\/\\/\\s+import\\s+(\\w+)\\s+from\\s+'" +
      escape(filePath) +
      "';"
  );
  let moduleName;
  const newContent = entryContent
    .replace(reg, (all, name) => {
      moduleName = name;
      return all.replace(/^\/\/\s+/, "");
    })
    .replace(new RegExp(`const ${moduleName} = \\{\\};`, 'g'), "");
  fs.writeFileSync(SERVER_ENTRY_PATH, newContent);
};

module.exports = { clearEntryContent, recoverEntryContent };
