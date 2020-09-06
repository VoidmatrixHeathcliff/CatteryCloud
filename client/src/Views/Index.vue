<template>
    <div>
        <div id="header" style="font-weight: bold;overflow: auto" v-html="headerPath"></div>
        <div id="panel" style="display:flex;alignItems: center;margin-bottom: 10px">
            <ButtonGroup shape="circle" style="flex: 1">
                <Button type="info" size="small" @click="jumpToLast" :disabled="!enableLastBtn">
                    <Icon type="md-arrow-round-back"></Icon>
                    上层目录
                </Button>
                <Button type="warning" size="small" @click="jumpToHome">
                    根目录
                    <Icon type="md-home"></Icon>
                </Button>
            </ButtonGroup>
            <Input search enter-button size="small" placeholder="搜索当前目录" style="float: right;width: 50%;flex: 1"
                   v-model="searchContent"/>
        </div>
        <div id="content">
            <div v-if="filterItems.length === 0" style="margin-top: 5%;margin-bottom: 5%;font-weight: bold">
                暂无文件
            </div>
            <div v-else>
                <List size="small" :loading="isLoading">
                    <ListItem style="text-align: left" v-for="(item, index) in filterItems" :key="index">
                        <ListItemMeta>
                            <template slot="avatar">
                                <div v-if=" item.type === 'folder'">
                                    <Avatar icon="ios-folder" size="38"/>
                                </div>
                                <div v-else>
                                    <div v-if="item.info.format === 'image'">
                                        <Avatar icon="md-images" size="38"/>
                                    </div>
                                    <div v-else-if="item.info.format === 'video'">
                                        <Avatar icon="logo-youtube" size="38"/>
                                    </div>
                                    <div v-else-if="item.info.format === 'music'">
                                        <Avatar icon="ios-musical-notes" size="38"/>
                                    </div>
                                    <div v-else-if="item.info.format === 'archive'">
                                        <Avatar icon="md-archive" size="38"/>
                                    </div>
                                    <div v-else-if="item.info.format === 'program'">
                                        <Avatar icon="logo-windows" size="38"/>
                                    </div>
                                    <div v-else-if="item.info.format === 'document'">
                                        <Avatar icon="md-document" size="38"/>
                                    </div>
                                    <div v-else-if="item.info.format === 'others'">
                                        <Avatar icon="md-help" size="38"/>
                                    </div>
                                </div>
                            </template>
                            <template slot="title">
                                <a href="" style="font-weight: bold"
                                   @click.prevent="jumpTo(item.link)">{{ item.name | filterItemName }}
                                </a>
                            </template>
                            <template slot="description">
                                <div v-if="item.type === 'folder'">
                                    {{ item.info.time }} - {{ item.info.num }} 项
                                </div>
                                <div v-else>
                                    {{ item.info.time }} - {{ item.info.size }}
                                </div>
                            </template>
                        </ListItemMeta>
                        <template slot="extra" v-if="item.type === 'folder'">
                            <Icon type="ios-arrow-forward" size="20"/>
                        </template>
                    </ListItem>
                </List>
            </div>
            <a id="a-Download" v-show="false" :href="downloadLink" :download="downloadFile"></a>
        </div>
        <div id="footer">
            服务器已运行<span style="color: #eb2f96"> {{ uptime }} </span>
        </div>
        <Modal v-model="showPreView" fullscreen :title="preViewTitle" ok-text="下载文件" cancel-text="退出预览" @on-ok="downloadPreViewFile">
            <div v-if="preViewType === 'image'" style="text-align: center;">
                <img :src="preViewFileLink" style="height: 100%;width: 100%;">
            </div>
            <div v-else-if="preViewType === 'video'">
                <!-- 处理视频预览 -->
            </div>
        </Modal>
    </div>
</template>

<script>
export default {
    name: 'Index',
    mounted() {
        this.axios({
            method: 'get',
            url: 'base',
        }).then((response) => {
            this.baseDir = response.data.base;
            this.items = response.data.items;
            this.isLoading = false;
        }).catch((error) => {
            console.log(error)
        });
        this.axios({
            method: 'get',
            url: 'uptime',
        }).then((response) => {
            this.uptime = response.data.uptime;
        }).catch((error) => {
            console.log(error)
        })
    },
    data() {
        return {
            isLoading: true,
            items: [],
            downloadLink: "",
            downloadFile: "",
            uptime: 'xx 时 xx 分 xx 秒',
            currentPath: "",
            baseDir: "",
            enableLastBtn: false,
            searchContent: "",
            showPreView: false,
            preViewTitle: "",
            preViewType: "",
            preViewFileLink: ""
        }
    },
    computed: {
        headerPath() {
            if (this.currentPath === "" || this.currentPath === this.baseDir) {
                return "Home" + "<span style='color: #fffcea'> \\ </span>";
            } else {
                if (this.currentPath.replace(this.baseDir, "Home\\").length >= 90) {
                    let shortPath = "<span style='color: #0affe1'> …… </span>" + this.currentPath.replace(this.baseDir, "Home\\").slice(-45);
                    return shortPath.replace(/\\/g, "<span style='color: #fffcea'> \\ </span>");
                } else {
                    return (this.currentPath + "\\").replace(this.baseDir, "Home\\").replace(/\\/g, "<span style='color: #fffcea'> \\ </span>");
                }
            }
        },
        filterItems() {
            return this.items.filter(item => {
                return item.name.toLowerCase().indexOf(this.searchContent.toLowerCase()) !== -1;
            });
        }
    },
    methods: {
        jumpTo(link) {
            this.isLoading = true;
            this.axios({
                method: 'get',
                url: link,
            }).then((response) => {
                this.isLoading = false;
                if (response.data.isDirectory) {
                    this.searchContent = "";
                    this.items = response.data.items;
                    this.currentPath = decodeURIComponent(link.substring(link.indexOf("dst=") + 4));
                    this.enableLastBtn = this.currentPath !== this.baseDir;
                } else {
                    const supportFormat = ["image"];    // 支持前端预览的文件类型
                    if (supportFormat.indexOf(response.data.format) !== -1) {
                        this.preViewType = response.data.format;
                        this.showPreView = true;
                        this.preViewTitle = decodeURIComponent(link.substring(link.indexOf("dst=") + 4)).split("\\").pop();
                        this.preViewFileLink = "download?link=" + link;
                        this.downloadLink = this.preViewFileLink;
                        this.downloadFile = decodeURIComponent(this.preViewFileLink).split('\\').pop();
                    } else {
                        this.downloadLink = "download?link=" + link;
                        this.downloadFile = decodeURIComponent(link).split('\\').pop();
                        this.$Modal.confirm({
                            title: '确定要下载此文件吗？',
                            onOk: () => {
                                document.getElementById("a-Download").click();
                            }
                        });
                    }
                }
            }).catch((error) => {
                console.log(error)
            });
        },
        jumpToLast() {
            let pathSections = this.currentPath.split("\\");
            pathSections.pop();
            pathSections.length === 1 ? this.jumpToHome() : this.jumpTo("cd?dst=" + encodeURIComponent(pathSections.join('\\')));
        },
        jumpToHome() {
            this.jumpTo("cd?dst=" + encodeURIComponent(this.baseDir));
        },
        downloadPreViewFile() {
            document.getElementById("a-Download").click();
        }
    },
    filters: {
        filterItemName(value) {
            if (value.length > 32) {
                return value.slice(0, 26) + "……" + value.slice(-4)
            } else {
                return value;
            }
        }
    }
}
</script>

<style scoped>
#header {
    background-color: #ff8e8e;
    border-radius: 5px;
    margin-bottom: 10px;
}

#content {
    background-color: #fffdf0;
    border-radius: 5px;
    padding: 1% 5% 1% 5%;
    overflow: auto;
    margin-bottom: 20px;
}

#footer {
    font-weight: bold;
}
</style>
