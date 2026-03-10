排查结论：
1. 关闭 VSCode 后网页打不开，根因不是 xtask 进程退出，而是浏览器访问的 localhost 指向本机；此前能访问主要依赖 VSCode Remote 的端口转发。
2. 实际服务运行在远端主机 gpux2，确认 3207 端口仍在监听，使用远端 IP 访问可正常打开页面。
3. 已修复启动链路：start.sh 默认改为委托 start-tmux.sh，在独立 tmux 会话中启动；start-tmux.sh 改为每次新建唯一会话，降低 VSCode/终端退出对服务的影响。
4. 已增强启动反馈：start.sh / start-tmux.sh 启动成功后会同时打印 localhost、127.0.0.1 和可直连 IP URL，便于直接访问。
5. stop.sh 已增加 tmux 会话关闭能力，并支持 --all；但为避免误伤非 xtask 任务，后续建议再收紧为仅依据 ~/.xtask/projects.yaml 中登记的 session/pid 做关闭。

当前状态：
- 远端服务可用
- 用户已确认使用 IP 地址可以访问
- 后续待办：进一步收紧 stop.sh 的匹配范围，避免误关闭非 xtask 任务。
