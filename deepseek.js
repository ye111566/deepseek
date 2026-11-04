// LiteLoader-AIDS automatic generated
/// <reference path="c:\Users\Lenovo/dts/HelperLib-master/src/index.d.ts"/>

ll.registerPlugin(
    /* name */ "deepseek",
    /* introduction */ "在 mc 里使用 deepseek (v4-flash / v4-pro)",
    /* version */[0, 0, 2]
);
function mdToMc(text) {
    // 先处理加粗 **text** 或 __text__
    text = text.replace(/\*\*(.+?)\*\*/g, '§l$1§r');
    //text = text.replace(/__(.+?)__/g, '§l$1§r');
    // 再处理斜体 *text* 或 _text_
    text = text.replace(/\*(.+?)\*/g, '§o$1§r');
    //text = text.replace(/_(.+?)_/g, '§o$1§r');
    // 可以继续扩展其他格式，如 ~~删除线~~ 等
    return text;
}
function extractFirstNumber(str) {
  const match = str.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}
/**
 * 判断字符串中是否包含 <runcmd>xxx</runcmd> 格式的标签
 * @param {string} text - 待检测的字符串
 * @returns {boolean} 是否匹配
 */
function isruncmdtext(text) {
    // 使用正则匹配 <runcmd> 和 </runcmd> 之间的任意非空内容
    const regex = /<runcmd>[^<]+<\/runcmd>/;
    return regex.test(text);
}
function isapitext(text) {
    const regex = /<api>[^<]+<\/api>/;
    return regex.test(text);
}
const gettps=ll.import("tps","gettps")

function getamount(target){
    return extractFirstNumber(mc.runcmdEx(`scoreboard players set ${target} total 0`).output)
}
function execute(theplayer, apiname, pro) {
    switch (true) {
        case apiname === 'tps':
            
            theplayer.runcmd(`deepseek ${pro} "${apiname}:${gettps()}"`);
            break;

        case apiname.startsWith('amount@'):
            // 提取 "@xxx" 部分（保留 @ 符号）
            const target = apiname.slice(6); // "amount@" 长度为7，slice(6) 得到 "@xxx"
            theplayer.runcmd(`deepseek ${pro} "${apiname}:${getamount(target)}"`);
            break;

        default:
            theplayer.runcmd(`deepseek ${pro} "${apiname} is invaild"`);
            // 可选的默认处理
            break;
    }
}
/**
 * 从字符串中提取 <runcmd>xxx</runcmd> 标签内的指令内容
 * @param {string} text - 待提取的字符串
 * @returns {string|null} 提取到的指令（去除首尾空格），若未匹配则返回 null
 */
function confinecmd(text) {
    const regex = /<runcmd>([^<]+)<\/runcmd>/;
    const match = text.match(regex);
    if (match) {
        // match[1] 是括号内捕获的指令内容
        return match[1].trim();
    }
    return null;
}
function confineapi(text) {
    const regex = /<api>([^<]+)<\/api>/;
    const match = text.match(regex);
    if (match) {
        // match[1] 是括号内捕获的指令内容
        return match[1].trim();
    }
    return null;
}
let cmdlist=[
    "kill @e[name=!fql,type=!player,type=!thrown_trident,type=!villager,type=!hopper_minecart]"
]
mc.listen('onServerStarted', () => {
    let cmd = mc.newCommand("deepseek", '§dmc里面使用deepseek!', PermType.Any);

    cmd.optional("pro", ParamType.Bool);
    cmd.optional("msg", ParamType.String);
    cmd.overload(["pro", "msg"]);
    cmd.overload([]);
    cmd.setCallback(
        (cmd, origin, out, res) => {

            if (!res.msg) {
                let contexts = new JsonConfigFile("./conversation_contexts.json");

                let fm = mc.newCustomForm();
                fm.addSwitch("提交后清空对话(不接收输入发送)", false);
                fm.setTitle("deepseek");
                let user = contexts.get(origin.player.uuid);
                if (user) {
                    for (let i = 0; i < user.length; i++) {
                        fm.addLabel(`§l§e${user[i]["role"]}`);
                        fm.addLabel(`§l§b${user[i]["content"]}`);
                        fm.addLabel(`\n`);
                    }
                }

                fm.addInput("发送给deepseek:", "发点什么吧", "");
                fm.addSwitch("Pro (v4-pro，关则为 v4-flash)", false);

                function form(player, data, reason) {
                    if (data) {
                        switch (data[0]) {
                            case true:
                                {
                                    let contexts = new JsonConfigFile("./conversation_contexts.json");
                                    contexts.delete(player.uuid);
                                }
                                player.tell("对话已经被全部清空");
                                break;
                            case false:
                                switch (data[data.length - 1]) {
                                    case true:
                                        log(`deepseek --pro true "${data[data.length - 2]}"`);
                                        player.runcmd(`deepseek true "${data[data.length - 2]}"`);
                                        break;
                                    case false:
                                        log(`deepseek --pro false "${data[data.length - 2]}"`);
                                        player.runcmd(`deepseek false "${data[data.length - 2]}"`);
                                        break;
                                }
                                break;
                        }
                    } else {
                        player.tell("未发送任何消息");
                    }
                    player.tell("您已成功发送消息给deepseek,请等待回复");
                }
                origin.player.sendForm(fm, form);
            }

            else if (res.msg) {
                let origin_player = origin.player;
                switch (res.pro) {
                    case true:
                        log("generate v4-pro");
                        system.cmd(
                            `python deepseek.py "${origin.player.uuid}" "${res.msg}" --pro`,
                            (exitcode, output) => {
                                output = mdToMc(output)
                                output = output.replace(/[\x00-\x1F\x7F]/g, '').trim();
                                log(`exitcode${exitcode}`);
                                log(output);
                                if (isruncmdtext(output)) {

                                    let thecmd = confinecmd(output).replaceAll("_", " ").replaceAll("yh", '"')
                                    origin_player.tell("deepseek帮你自动输入对应指令啦!")
                                    origin_player.tell(`指令是${thecmd}`)
                                    if (thecmd.startsWith("supercmd")) {
                                        mc.runcmdEx(cmdlist[parseInt(thecmd.match(/\d+/)?.[0])])
                                    } else {
                                        origin_player.runcmd(thecmd)
                                    }

                                }else if(isapitext(output)){
                                    let apiname=confineapi(output)
                                    execute(origin_player,apiname,true)
                                }
                                else if (exitcode == 0) {
                                    origin_player.tell(`§l§e<deepseek-pro>§l§b${output}`);
                                    let ans = mc.newCustomForm();
                                    ans.setTitle("deepseek-pro");
                                    ans.addLabel(output);
                                    origin_player.sendForm(ans, (pl, d, r) => { pl.runcmd("deepseek"); });
                                }
                            }
                        );
                        break;
                    case false:
                        log("generate v4-flash");
                        system.cmd(
                            `python deepseek.py "${origin.player.uuid}" "${res.msg}"`,
                            (exitcode, output) => {
                                output = mdToMc(output)
                                output = output.replace(/[\x00-\x1F\x7F]/g, '').trim();
                                log(`exitcode${exitcode}`);
                                log(output); if (isruncmdtext(output)) {
                                    let thecmd = confinecmd(output).replaceAll("_", " ").replaceAll("yh", '"')
                                    origin_player.tell("deepseek帮你自动输入对应指令啦!")
                                    origin_player.tell(`指令是${thecmd}`)
                                    if (thecmd.startsWith("supercmd")) {
                                        mc.runcmdEx(cmdlist[parseInt(thecmd.match(/\d+/)?.[0])])
                                    } else {
                                        origin_player.runcmd(thecmd)
                                    }

                                }
                                else if(isapitext(output)){
                                    let apiname=confineapi(output)
                                    execute(origin_player,apiname,false)
                                }
                                else if (exitcode == 0) {
                                    origin_player.tell(`§l§e<deepseek>§l§b${output}`);
                                    let ans = mc.newCustomForm();//{let ans = mc.newCustomForm();ans.setTitle("deepseek");ans.addLabel("1");mc.getPlayer("ye111566").sendForm(ans, (pl, d, r) => { pl.tell("tmsg"); });}
                                    ans.setTitle("deepseek");
                                    ans.addLabel(output);
                                    origin_player.sendForm(ans, (pl, d, r) => { pl.runcmd("deepseek"); });
                                }
                            }
                        );
                        break;
                }
            }
        }
    );
    cmd.setup();
});
