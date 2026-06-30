# 云服务器部署

这个项目是纯前端应用，生产环境只需要托管 `dist` 静态文件。

## Docker 方式

在服务器上安装 Docker 后，进入项目目录执行：

```bash
docker build -t chinese-char-game .
docker run -d --name chinese-char-game --restart unless-stopped -p 80:80 chinese-char-game
```

访问：

```text
http://服务器公网IP
```

## 更新版本

```bash
docker stop chinese-char-game
docker rm chinese-char-game
docker build -t chinese-char-game .
docker run -d --name chinese-char-game --restart unless-stopped -p 80:80 chinese-char-game
```

## Nginx 方式

本地或服务器执行：

```bash
npm ci
npm run build
```

把 `dist` 目录上传到服务器的 Nginx 静态目录，并使用 `nginx.conf` 里的配置。
