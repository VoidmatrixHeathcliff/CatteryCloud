var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var os = require("os");
var path = require('path');
var moment = require('moment');
var util = require('util');
var app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* 默认配置 */
var base_dir = "D:\\";
var port = 8085;

try {
    var config = JSON.parse(fs.readFileSync("config.json"));
    base_dir = config.base_dir;
    if (base_dir.split('\\').length > 2 && base_dir.endsWith('\\')) {
        var pathSections = base_dir.split('\\');
        pathSections.pop();
        base_dir = pathSections.join('\\');
    };
    port = config.port;
} catch (error) {
    console.log('\n\x1B[41mFailed to load external configuration file, trying to run with default configuration! \x1B[49m\n');
}

app.use(express.static(path.join(__dirname, 'dist')))

function checkFileFormat(fileName) {
    if (fileName.indexOf('.') === -1) {
        return "others";
    } else {
        switch (fileName.split('.').pop().toLowerCase()) {
            case 'jpg': case 'jpeg': case 'png': case 'gif': case 'tif': case 'tiff': case 'bmp': case 'webp': case 'svg':
                return "image";
            case 'mp4': case 'mpeg': case 'avi': case 'rm': case 'rmbv': case 'mkv': case '3gp': case 'webm': case 'ts': case 'flv': case 'wmv':
                return "video";
            case 'mp3': case 'flac': case 'wav': case 'midi': case 'wma': case 'mid':
                return "music";
            case 'zip': case 'rar': case '7z': case 'tgz': case 'gz': case 'tar': case 'z01': case 'z02': case 'z03':
                return "archive";
            case 'exe': case 'sys': case 'com': case 'msi':
                return "program";
            case 'txt': case 'doc': case 'docx': case 'md': case 'pdf':
                return "document";
            default:
                return "others";
        }
    }
}

function generateItemsInfo(dst) {
    var itemNames = fs.readdirSync(dst);
    /* 屏蔽文件或文件夹列表 */
    var blacklist = ["System Volume Information", "$RECYCLE.BIN"];
    blacklist.forEach(item => {
        if (itemNames.indexOf(item) !== -1) {
            itemNames.splice(itemNames.indexOf(item), 1);
        }
    });
    var items = [];
    itemNames.forEach(itemName => {
        var item = {};
        var stats = fs.statSync(path.join(dst, itemName));
        item.name = itemName;
        item.link = "cd?dst=" + encodeURIComponent(path.join(dst, itemName));
        var info = {};
        info.time = moment(stats.mtimeMs).format('YYYY-MM-DD');
        if (stats.isDirectory()) {
            item.type = "folder";
            info.num = fs.readdirSync(path.join(dst, itemName)).length;
        } else {
            item.type = "file";
            info.format = checkFileFormat(itemName);
            if (stats.size < 1024) {
                info.size = stats.size + " B";
            } else if (stats.size < 1048576) {
                info.size = Math.round(stats.size / 1024 * 100) / 100 + " KB";
            } else if (stats.size < 1073741824) {
                info.size = Math.round(stats.size / 1048576 * 100) / 100 + " MB";
            } else if (stats.size < 1099511627776) {
                info.size = Math.round(stats.size / 1073741824 * 100) / 100 + " GB";
            }
        }
        item.info = info;
        items.push(item);
    });

    items.sort(function (item1, item2) {
        if (item1.type !== item2.type) {
            return item1.type === 'folder' ? -1 : 1;
        } else {
            return item1.name > item2.name ? 1 : -1;
        }
    });

    return items;
}

app.get('/uptime', urlencodedParser, function (req, res) {
    var time = os.uptime();
    if (time < 60) {
        var uptime = time + " 秒"
    } else if (time < 3600) {
        var minute = Math.floor(time / 60);
        var second = time % 60;
        var uptime = minute + " 分 " + second + " 秒";
    } else if (time < 86400) {
        var hour = Math.floor(time / 3600);
        var minute = Math.floor(time / 60) - hour * 60;
        var second = time % 60;
        var uptime = hour + " 时 " + minute + " 分 " + second + " 秒";
    } else {
        var day = Math.floor(time / 86400);
        var hour = Math.floor(time / 3600) - day * 24;
        var minute = Math.floor(time / 60) - day * 1440 - hour * 60;
        var uptime = day + " 天 " + hour + " 时 " + minute + " 分";
    }
    var timeInfo = {
        "uptime": uptime
    };
    res.end(JSON.stringify(timeInfo));
});

app.get('/base', urlencodedParser, function (req, res) {
    var baseInfo = {
        "base": base_dir,
        "items": generateItemsInfo(base_dir)
    };
    console.log(util.format("\x1B[33m[%s]Access BaseDirectory:  %s\x1B[39m", moment().format('YYYY-MM-DD HH:mm:ss'), base_dir));
    res.end(JSON.stringify(baseInfo));
});

app.get('/cd', urlencodedParser, function (req, res) {
    var dst = req.query.dst;
    console.log(util.format("\x1B[34m[%s]Access Path:  %s\x1B[39m", moment().format('YYYY-MM-DD HH:mm:ss'), dst));
    var stats = fs.statSync(dst);
    if (stats.isDirectory()) {
        var fileInfo = {
            "isDirectory": true,
            "items": generateItemsInfo(dst),
        }
        res.end(JSON.stringify(fileInfo));
    } else {
        var fileInfo = {
            "isDirectory": false,
            "format": checkFileFormat(dst.split("\\").pop())
        }
        res.end(JSON.stringify(fileInfo));
    }
});

app.get('/download', urlencodedParser, function (req, res) {
    var link = req.query.link;
    var file = link.substring(link.indexOf("dst=") + 4);
    console.log(util.format("\x1B[35m[%s]Get Resource:  %s\x1B[39m", moment().format('YYYY-MM-DD HH:mm:ss'), file));
    res.sendFile(file);
});


app.listen(port, function () {
    console.log("\x1B[32m< CatteryCloud > Server booted successfully!\x1B[39m");
    console.log(util.format("\x1B[32mPort: %s | BaseDirectory: \"%s\"\x1B[39m\n", port, base_dir));
})
