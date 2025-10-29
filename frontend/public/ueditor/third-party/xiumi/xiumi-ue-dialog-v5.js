/**
 * Created by shunchen_yang on 16/10/25.
 */
UE.registerUI('dialog', function (editor, uiName) {
    var btn = new UE.ui.Button({
        name   : 'xiumi-connect',
        title  : '秀米',
        onclick: function () {
            var dialog = new UE.ui.Dialog({
                iframeUrl: '/ueditor/xiumi-ue-dialog-v5.html',
                editor   : editor,
                name     : 'xiumi-connect',
                title    : "秀米图文消息助手",
                cssRules : "width: " + (window.innerWidth - 60) + "px;" + "height: " + (window.innerHeight - 60) + "px;",
            });
            dialog.render();
            dialog.open();
            try {
                // 赋予子 iframe 剪贴板权限，缓解权限策略限制
                setTimeout(function(){
                    var ifr = document.querySelector('iframe[src$="xiumi-ue-dialog-v5.html"]');
                    if (ifr) {
                        ifr.setAttribute('allow', 'clipboard-read; clipboard-write');
                    }
                }, 0);
            } catch (e) {}
        }
    });

    return btn;
});
