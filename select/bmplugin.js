/*
 * 自定义dom的tap事件
 * callback:回调函数，传入当前对象作为参数
 */
(function ($, window, document) {
    var touchstart = function () {
        alert('touchstart');
        $(this).data("isMove", false);
        $(this).data("startTime", Date.now());
    };

    var touchmove = function () {
        $(this).data("isMove", true);
    };

    var touchend = function (event) {
        //如果发生了移动就不执行回调  
        if ($(this).data("isMove")) {
            return;
        }
        //如果大于延时时间就不执行回调函数  
        if (Date.now() - $(this).data("startTime") > $(this).data("delayTime")) {
            return;
        }
        if (typeof event.data.callback === 'function') {
            event.data.callback(event.data.thisobj);
        }
    };

    $.event.special.bmtap = {
        add: function (handleObj) {
            var $target = $(this);
            bmcommonjs.isMobile() ? $target.on("touchstart.bmtap", touchstart) : $target.on("mousedown.bmtap", touchstart);
            bmcommonjs.isMobile() ? $target.on("touchmove.bmtap", touchmove) : $target.on("mousemove.bmtap", touchmove);
            bmcommonjs.isMobile() ? $target.on("touchend.bmtap", '', {callback: handleObj.handler, thisobj: $target}, touchend) : $target.on("mouseup.bmtap", '', {callback: handleObj.handler, thisobj: $target}, touchend);
        },
        setup: function (data, namespace, eventHandle) {
            var $target = $(this);
            $target.data("startTime", 0);
            $target.data("delayTime", 200);
            $target.data("isMove", false);
        },
        teardown: function (namespaces) {

        },
        remove: function () {
            $(this).off(".bmtap");
        }
    };

})(jQuery, window, document);
/*
 * 提示信息插件
 */
(function ($, window, document) {
    var bmtips = {
    };
    var closeobj = null;
    //创建Tips对象
    function createTipsObj() {
        var loading = $('<div id="BMTips" class="BMTips"><div></div></div>');
        $('body').append(loading);
    }

    //获取Tips对象
    function getTipsObj() {
        if ($('#BMTips').length == 0) {
            createTipsObj();
        }
    }

    //关闭提示信息
    function close() {
        $('#BMTips').fadeOut(200, function () {
            $('#BMTips').removeClass('BMTipsPop');
        });
    }

    //显示提示信息
    bmtips.show = function (html) {
        //1.获取对象
        getTipsObj();
        //2.关闭上一个提示
        if (typeof closeobj === 'number') {
            clearTimeout(closeobj);
        }
        close();
        //3.显示当前提示
        $('#BMTips div').html(html);
        $('#BMTips').fadeIn(1, function () {
            $('#BMTips').addClass('BMTipsPop')
        });
        closeobj = setTimeout(close, 3000);
    };
    //将插件添加进jQuery中
    $.bmtips = bmtips;
})(jQuery, window, document);
/*
 * ajax
 *  data:发送的数据，如{"optype": "saveaccountinfo", "savetype":'edit', "accountinfo": JSON.stringify(accountmanage.accountinfosave)}
 *  async:是否异步调用，默认为是
 *  success:ajax调用成功的回调方法，都需要
 *  error:ajax调用失败的回调方法，一般不需要
 *  complete:ajax调用完成的回调方法，成功或失败都会调用，一般不需要
 */
(function ($, window, document) {
    //默认参数
    var defaultoption = {
        url: '',
        type: 'post',
        data: {},
        dataType: 'json',
        async: true,
        success: null,
        error: null,
        complete: null,
        isloading: true
    };
    //ajax对象
    var _bmajax = function (options) {
        var plugin = this;
        //参数
        plugin._options = options;
        //事件
        plugin._event = {
            /**
             * 不需要loading的操作
             */
            notloading: ['login', 'logout'],
            /**
             * ajax操作是否显示loading层
             */
            isshowloading: function () {
                if ($.inArray(plugin._options['data']['optype'], plugin._event.notloading) < 0 && plugin._options['isloading']) {
                    return true;
                } else {
                    return false;
                }
            },
            /**
             * ajax调用
             */
            ajax: function () {
                $.ajax({
                    url: plugin._options['url'],
                    type: plugin._options['type'],
                    data: plugin._options['data'],
                    dataType: plugin._options['dataType'],
                    async: plugin._options['async'],
                    error: function (jqXHR, textStatus, errorThrown) {
                        //ajax调用失败处理
                        //执行error回调函数
                        if (typeof plugin._options['error'] === 'function') {
                            plugin._options['error'](jqXHR, textStatus, errorThrown);
                        }
                    },
                    success: function (data) {
                        //处理未登录，非ajax请求，没有权限的错误
                        if (!bmcommonjs.refresh(data)) {
                            return;
                        }
                        //记录ajax调用时间
                        //执行success回调函数
                        if (typeof plugin._options['success'] === 'function') {
                            plugin._options['success'](data);
                        }
                    },
                    complete: function (jqXHR, textStatus) {
                        //执行success回调函数
                        if (typeof plugin._options['complete'] === 'function') {
                            plugin._options['complete'](jqXHR, textStatus);
                        }
                        if (plugin._options['data']['optype'] !== 'loadlist') {

                        }
                    }
                });
            }
        };
    };
    //插件暴露的方法
    _bmajax.prototype = {
        ajax: function () {
            this._event.ajax();
        }
    };
    var bmajax = {
        ajax: function (option) {
            //合并参数
            var _option = $.extend(true, {}, defaultoption, typeof option === "object" ? option : {});
            //修改ajax的url
            _option['url'] = bmcommonjs.getajaxurl(_option['url']);
            //实例化ajax对象并调用
            var objajax = new _bmajax(_option);
            objajax.ajax();
        }
    };
    //将插件添加进jQuery中
    $.bmajax = bmajax;
})(jQuery, window, document);
/*
 * alert插件
 * 参数
 *  surebtntext:确定按钮文字，默认为【确定】
 *  msg:弹出的消息，可以为html格式
 *  maskclickclose:点击蒙板是否关闭，默认为false
 * 事件
 *  onSure:当用户点击确定按钮关闭消息后触发，可以为空
 */
(function ($, window, document) {
    //alert对象
    var _bmalert = function (option) {
        var plugin = this;
        //默认参数
        plugin._default = {
            surebtntext: '确定',
            msg: '',
            maskclickclose: false,
            onSure: null
        };
        //参数
        plugin._options = $.extend(true, {}, plugin._default, typeof option === "object" ? option : {});
        //属性
        plugin._thisattr = {
            dialogid: 'BMAlert',
            zindex: 4002
        };
        //事件
        plugin._event = {
            show: function () {
                $('#BMAlert').show();
                $('#BMAlertLay').show();
            },
            close: function () {
                $('#BMAlert').hide();
                $('#BMAlertLay').hide();
            }
        };
        //插件渲染
        plugin._render = {
            /**
             * 创建alert的html对象
             */
            createdom: function () {
                $('#BMAlert').remove();
                if ($('#BMAlert').length == 0) {
                    var alert = $('<div id="BMAlert" class="BMAlert"></div>');
                    var alertbd = $('<div class="BMAlertbd"><div class="BMAlertmsg"></div></div>');
                    var alertft = $('<div class="BMAlertft"><span>' + plugin._options['surebtntext'] + '</span></div>');
                    alert.append(alertbd).append(alertft);
                    $('body').append(alert);
                }
                if ($('#BMAlertLay').length == 0) {
                    var alertlay = $('<div id="BMAlertLay" class="BMAlertLay"></div>');
                    $('body').append(alertlay);
                }
            },
            /**
             * 设置msg信息
             */
            setmsg: function () {
                $('#BMAlert .BMAlertmsg').html(plugin._options['msg']);
            },
            /**
             * 绑定事件
             */
            bindevent: function () {
                $('#BMAlert .BMAlertft span').off('click').on('click', function () {
                    plugin._event.close();
                    if (typeof plugin._options['onSure'] === 'function') {
                        plugin._options['onSure']();
                    }
                });
                if (plugin._options['maskclickclose'] === true) {
                    $('#BMAlertLay').off('click').on('click', function () {
                        plugin._event.close();
                    });
                }
            },
            run: function () {
                this.createdom();
                this.setmsg();
                this.bindevent();
            }
        };

        plugin._render.run();
    };

    //插件暴露方法
    _bmalert.prototype = {
        show: function () {
            this._event.show();
        }
    };

    var bmalert = function (option) {
        var objalert = new _bmalert(option);
        objalert.show();
    };

    //将插件添加进jQuery中
    $.bmalert = bmalert;

})(jQuery, window, document);
/*
 * confirm插件
 * 参数
 *  surebtntext:确定按钮文字，默认为【确定】
 *  cancelbtntext:取消按钮文字，默认为【取消】
 *  msg:弹出的消息，可以为html格式
 *  maskclickclose:点击蒙板是否关闭，默认为false
 * 事件
 *  onSure:当用户点击确定按钮关闭消息后触发，可以为空
 *  onCancel:当用户点击取消按钮关闭消息后触发，可以为空
 */
(function ($, window, document) {
    //confirm对象
    var _bmconfirm = function (option) {
        var plugin = this;
        //默认参数
        plugin._default = {
            surebtntext: '确定',
            cancelbtntext: '取消',
            msg: '',
            maskclickclose: false,
            onSure: null,
            onCancel: null
        };
        //参数
        plugin._options = $.extend(true, {}, plugin._default, typeof option === "object" ? option : {});
        //属性
        plugin._thisattr = {
            dialogid: 'BMConfirm',
            zindex: 4004
        };
        //事件
        plugin._event = {
            show: function () {
                $('#BMConfirm').show();
                $('#BMConfirmLay').show();
            },
            close: function () {
                $('#BMConfirm').hide();
                $('#BMConfirmLay').hide();
            }
        };
        //插件渲染
        plugin._render = {
            /**
             * 创建confirm的html对象
             */
            createdom: function () {
                $('#BMConfirm').remove();
                if ($('#BMConfirm').length == 0) {
                    var alert = $('<div id="BMConfirm" class="BMConfirm"></div>');
                    var alertbd = $('<div class="BMConfirmbd"><div class="BMConfirmmsg"></div></div>');
                    var alertft = $('<div class="BMConfirmft"><span BMType="cancel">' + plugin._options['cancelbtntext'] + '</span><span BMType="sure">' + plugin._options['surebtntext'] + '</span></div>');
                    alert.append(alertbd).append(alertft);
                    $('body').append(alert);
                }
                if ($('#BMConfirmLay').length == 0) {
                    var alertlay = $('<div id="BMConfirmLay" class="BMConfirmLay"></div>');
                    $('body').append(alertlay);
                }
            },
            /**
             * 设置msg信息
             */
            setmsg: function () {
                $('#BMConfirm .BMConfirmmsg').html(plugin._options['msg']);
            },
            /**
             * 绑定事件
             */
            bindevent: function () {
                $('#BMConfirm .BMConfirmft span').off('click').on('click', function () {
                    plugin._event.close();
                    var bmtype = $(this).attr('BMType');
                    switch (bmtype) {
                        case 'sure':
                            if (typeof plugin._options['onSure'] === 'function') {
                                plugin._options['onSure']();
                            }
                            break;
                        case 'cancel':
                            if (typeof plugin._options['onCancel'] === 'function') {
                                plugin._options['onCancel']();
                            }
                            break;
                    }
                });
                if (plugin._options['maskclickclose'] === true) {
                    $('#BMConfirmLay').off('click').on('click', function () {
                        plugin._event.close();
                    });
                }
            },
            run: function () {
                this.createdom();
                this.setmsg();
                this.bindevent();
            }
        };

        plugin._render.run();
    };

    //插件暴露方法
    _bmconfirm.prototype = {
        show: function () {
            this._event.show();
        }
    };

    var bmconfirm = function (option) {
        var objconfirm = new _bmconfirm(option);
        objconfirm.show();
    };

    //将插件添加进jQuery中
    $.bmconfirm = bmconfirm;

})(jQuery, window, document);
/*
 * prompt插件
 * 参数
 *  type:input或textarea，默认为input
 *  maxlength：最大可输入字节数，默认为20，最好不要超过100
 *  
 *  msgtitle:消息标题，可以为html格式，默认为【信息输入】
 *  msgtips:消息tip，可以为html格式，默认为空
 *  msgholder:输入框占位文字，默认为【请填写】
 *  
 *  surebtntext:确定按钮文字，默认为【确定】
 *  cancelbtntext:取消按钮文字，默认为【取消】
 *  
 *  maskclickclose:点击蒙板是否关闭，默认为false
 * 事件
 *  onBeforeSure：当用户点击确认按钮时，调用此方法进行输入验证，是否为空或者格式等。如果返回空字符串为验证成功，否则验证失败
 *  onSure:当用户点击确定按钮关闭消息后触发，可以为空
 *  onCancel:当用户点击取消按钮关闭消息后触发，可以为空
 */
(function ($, window, document) {
    //prompt对象
    var _bmprompt = function (option) {
        var plugin = this;
        //默认参数
        plugin._default = {
            type: 'input',
            maxlength: 20,
            msgtitle: '信息输入',
            msgtips: '',
            msgholder: '请填写',
            surebtntext: '确定',
            cancelbtntext: '取消',
            maskclickclose: false,
            onBeforeSure: null,
            onSure: null,
            onCancel: null
        };
        //参数
        plugin._options = $.extend(true, {}, plugin._default, typeof option === "object" ? option : {});
        //属性
        plugin._thisattr = {
            /**
             * 是否为关闭操作
             */
            isclose: false,
            /**
             * 当前视口高度
             */
            curwindowheight: 0,
            /**
             * 弹出软键盘，弹出框是否滑动
             * ios与window.height<400不滑动
             */
            ismove: false,
            /**
             * 输入框上一次的值
             */
            oldvalue: '',
            dialogid: 'BMPrompt',
            zindex: 4006
        };
        //事件
        plugin._event = {
            show: function () {
                plugin._thisattr.isclose = false;
                $('#BMPromptLay').show();
                $('#BMPrompt').show();
                $('#BMPrompt').find('textarea,input').focus();
            },
            close: function () {
                plugin._thisattr.isclose = true;
                $('#BMPrompt').fadeOut('normal', function () {
                    //移除动画样式
                    $('#BMPrompt').css({animation: ''});
                });
                $('#BMPromptLay').hide();
            }
        };
        //插件渲染
        plugin._render = {
            /**
             * 创建prompt的html对象
             */
            createdom: function () {
                $('#BMPrompt').remove();
                if ($('#BMPrompt').length == 0) {
                    var alert = $('<div id="BMPrompt" class="BMPrompt"></div>');
                    var alertbd = $('<div class="BMPromptbd"><div class="BMPromptmsgtitle"></div>');
                    if (plugin._options['type'] == 'textarea') {
                        alertbd.append('<div><textarea rows="3" class="bmformcontrol" placeholder="' + plugin._options['msgholder'] + '" /></textarea><div></div></div>');
                        alertbd.append('<div style="padding-top:0.3rem;"><div class="BMPrompterr"></div><span class="wordcount">0/' + plugin._options['maxlength'] + '</span></div>');

                        alertbd.css({'padding-bottom': '0'});
                        alertbd.find('.BMPromptmsgtitle').css({'margin-bottom': '1rem'});
                        alertbd.find('.BMPrompterr').css({'display': 'inline-block', 'width': '80%'});
                        alertbd.find('.wordcount').css({'padding-bottom': '0', 'vertical-align': 'middle'});
                    } else {
                        alertbd.append('<div><input type="text" class="bmformcontrol bmtextboxbottom" placeholder="' + plugin._options['msgholder'] + '" /><span class="wordcount">0/' + plugin._options['maxlength'] + '</span></div>');
                        alertbd.append('<div style="padding-top:0.3rem;"><div class="BMPrompterr"></div></div>');
                    }
                    alertbd.append('<div class="BMPrompttips"></div>');
                    var alertft = $('<div class="BMPromptft"><span BMType="cancel">' + plugin._options['cancelbtntext'] + '</span><span BMType="sure">' + plugin._options['surebtntext'] + '</span></div>');
                    alert.append(alertbd).append(alertft);
                    $('body').append(alert);
                }
                if ($('#BMPromptLay').length == 0) {
                    var alertlay = $('<div id="BMPromptLay" class="BMPromptLay"></div>');
                    $('body').append(alertlay);
                }
            },
            /**
             * 设置msg信息
             */
            setmsg: function () {
                $('#BMPrompt .BMPromptmsgtitle').html(plugin._options['msgtitle']);
                $('#BMPrompt .BMPrompttips').html(plugin._options['msgtips']);
                $('#BMPrompt .BMPromptbd textarea,#BMPrompt .BMPromptbd input').val('');
                $('#BMPrompt').find('.BMPrompterr').html('');
            },
            /**
             * 绑定事件
             */
            bindevent: function () {
                $('#BMPrompt .BMPromptft span').off('click').on('click', function () {
                    var bmtype = $(this).attr('BMType');
                    switch (bmtype) {
                        case 'sure':
                            var inputval = $('#BMPrompt .BMPromptbd textarea').length > 0 ? $('#BMPrompt .BMPromptbd textarea').val() : $('#BMPrompt .BMPromptbd input').val();
                            if (typeof plugin._options['onBeforeSure'] === 'function') {
                                var errmsg = plugin._options['onBeforeSure'](inputval);
                                if (errmsg != '') {
                                    $('#BMPrompt').find('textarea,input').focus();
                                    $('#BMPrompt').find('.BMPrompterr').html(errmsg);
                                    return;
                                }
                            }
                            if (typeof plugin._options['onSure'] === 'function') {
                                plugin._event.close();
                                plugin._options['onSure'](inputval);
                            }
                            break;
                        case 'cancel':
                            plugin._event.close();
                            if (typeof plugin._options['onCancel'] === 'function') {
                                plugin._options['onCancel']();
                            }
                            break;
                    }
                });
                if (plugin._options['maskclickclose'] === true) {
                    $('#BMPromptLay').off('click').on('click', function () {
                        plugin._event.close();
                    });
                }
                $('#BMPrompt .BMPromptbd textarea,#BMPrompt .BMPromptbd input').off('input').on('input', function () {
                    //表情处理
                    var oldval = $(this).val();
                    var newval = bmcommonjs.dealEmoji(oldval);
                    var intblen = plugin._render.getlength(newval);
                    //字节比较
                    if (intblen > plugin._options['maxlength']) {
                        $(this).val(plugin._thisattr.oldvalue);
                        return;
                    }
                    plugin._thisattr.oldvalue = newval;
                    //字数记录
                    $('#BMPrompt .wordcount').html(intblen + '/' + plugin._options['maxlength']);
                    if (newval != oldval) {
                        $(this).val(newval);
                    }
                });
                $('#BMPrompt .BMPromptbd textarea,#BMPrompt .BMPromptbd input').off('focus').on('focus', function () {
                    if (plugin._thisattr.ismove) {
                        $('#BMPrompt').css({'-webkit-animation': 'BMPromptmove_up' + ' 200ms linear forwards'});
                    }
                });
                $(window).on('resize', function () {
                    if (plugin._thisattr.ismove) {
                        if ($('#BMPrompt').css('display') == 'block' && plugin._thisattr.isclose == false && plugin._thisattr.curwindowheight == $(window).height()) {
                            $('#BMPrompt .BMPromptbd textarea,#BMPrompt .BMPromptbd input').blur();
                            $('#BMPrompt').css({'-webkit-animation': 'BMPromptmove_down' + ' 200ms linear forwards'});
                        }
                    }
                });
            },
            getlength: function (str) {
                var l = str.length;
                var blen = 0;
                for (var i = 0; i < l; i++) {
                    if ((str.charCodeAt(i) & 0xff00) != 0) {
                        blen++;
                    }
                    blen++;
                }
                return blen;
            },
            init: function () {
                //运行参数
                plugin._thisattr.curwindowheight = $(window).height();
                plugin._thisattr.ismove = bmcommonjs.isIOS() || $(window).height() < 400 ? false : true;
                //窗体居中样式
                if (plugin._thisattr.ismove) {
                    var top = $(window).innerHeight() / 2 - $('#BMPrompt').outerHeight() / 2;
                    var left = $(window).innerWidth() / 2 - $('#BMPrompt').outerWidth() / 2;
                    $('#BMPrompt').css({top: top + 'px', left: left + 'px'});
                } else {
                    $('#BMPrompt').css({top: '50%', left: '50%', transform: 'translate(-50%,-50%)'});
                }
                //动画变化效果
                var movetop = -($(window).innerHeight() / 2 - $('#BMPrompt').outerHeight() / 2 - $('.header').outerHeight() / 5.4 * 8);
                $('#BMPromptmove').remove();
                var style = $('<style></style>').attr({'id': 'BMPromptmove', 'type': 'text/css'});
                var keyFrames = '\
                        @-webkit-keyframes BMPromptmove_up{' +
                        '0% {\
                                -webkit-transform: translate(0px,0px);\
                            }' +
                        '100% {\
                                    -webkit-transform: translate(0px,' + movetop + 'px);\
                                }\
                        }\
                        @-webkit-keyframes BMPromptmove_down{' +
                        '0% {\
                                -webkit-transform: translate(0px,' + movetop + 'px);\
                            }' +
                        '100% {\
                                    -webkit-transform: translate(0px,0px);\
                                }\
                        }';
                style.html(keyFrames);
                $('head').append(style);
            },
            run: function () {
                this.createdom();
                this.init();
                this.setmsg();
                this.bindevent();
            }
        };
        plugin._render.run();
    };
    //插件暴露方法
    _bmprompt.prototype = {
        show: function () {
            this._event.show();
        }
    };
    var bmprompt = function (option) {
        var objprompt = new _bmprompt(option);
        objprompt.show();
    };
    //将插件添加进jQuery中
    $.bmprompt = bmprompt;
})(jQuery, window, document);
/*
 * 页面底部按钮组
 * 参数
 *  title:按钮组标题
 *  buttons:按钮[{
 "bmtype": "sureaa", //按钮id，一个弹出框中按钮id不要重复
 "iconcss":"bottomtool-down",//按钮关联的图标               
 "name": "确认", //按钮名称
 "callback": function() {//按钮回调事件
 alert(1);
 }
 }]
 * 事件
 *  
 * 方法
 *  show:显示对话框
 *  close:关闭对话框 
 */
(function ($, window, document) {
    //插件入口
    var bmbottomtool = function (element, options) {
        //当前dom对象
        var $this = $(element), plugin = this;
        //参数
        plugin._options = options;
        /**
         *按钮事件
         */
        plugin._buttonevent = {};
        /**
         *事件
         */
        plugin._event = {
            /**
             * 显示弹出框
             */
            show: function () {
                $('#' + plugin._thisattr.maskid).fadeIn();
                $('#' + plugin._thisattr.dialogid).css({'-webkit-animation': 'bottomtoolup_' + plugin._thisattr.dialogid + ' 200ms linear forwards'});
            },
            /**
             * 关闭弹出框
             */
            close: function () {
                $('#' + plugin._thisattr.dialogid).css({'-webkit-animation': 'bottomtooldown_' + plugin._thisattr.dialogid + ' 200ms linear forwards'});
                $('#' + plugin._thisattr.maskid).fadeOut();
            }
        };
        /**
         *插件渲染
         */
        plugin._render = {
            /**
             *绑定事件
             */
            bindevent: function () {
                //按钮事件
                $('#' + plugin._thisattr.dialogid).find('li[BMType]').off('click').on('click', function () {
                    if (plugin._buttonevent[$(this).attr('BMType')] && plugin._render.isfunc(plugin._buttonevent[$(this).attr('BMType')])) {
                        plugin._buttonevent[$(this).attr('BMType')]();
                    }
                });
                //点击mask关闭
                $('#' + plugin._thisattr.maskid).off('click').on('click', function () {
                    plugin._event.close();
                });
            },
            /**
             *设置样式
             */
            setcss: function () {
                //记录按钮组高度                
                plugin._thisattr.dialogheight = $('#' + plugin._thisattr.dialogid).outerHeight();
                //隐藏按钮组
                $('#' + plugin._thisattr.dialogid).css({'-webkit-transform': 'translate(0px,' + plugin._thisattr.dialogheight + 'px)', 'display': 'block'});
                //添加变化样式
                $('#bottomtool_' + plugin._thisattr.dialogid).remove();
                var style = $('<style></style>').attr({'id': 'bottomtool_' + plugin._thisattr.dialogid, 'type': 'text/css'});
                var keyFrames = '\
                    @-webkit-keyframes bottomtoolup_' + plugin._thisattr.dialogid + '{' +
                        '0% {\
                            -webkit-transform: translate(0px,' + plugin._thisattr.dialogheight + 'px);\
                        }' +
                        '100% {\
                            -webkit-transform: translate(0px,0px);\
                        }\
                    }\
                    @-webkit-keyframes bottomtooldown_' + plugin._thisattr.dialogid + '{' +
                        '0% {\
                             -webkit-transform: translate(0px,0px);\
                        }' +
                        '100% {\
                            -webkit-transform: translate(0px,' + plugin._thisattr.dialogheight + 'px);\
                        }\
                    }';
                style.html(keyFrames);
                $('head').append(style);
            },
            /**
             *弹出框外部主体
             */
            renderwrp: function () {
                var dialogmask = $('<div class="BMBottomToolLay"></div>').attr({"id": plugin._thisattr.maskid});
                var dialogwrp = $this.addClass('BMBottomTool');
                var dialoghd = $('<div class="BMBottomToolhd"><span>' + plugin._options['title'] + '</span></div>');
                var dialogbd = $('<div class="BMBottomToolbd"><ul></ul></div>');
                for (var i = 0; i < plugin._options.buttons.length; i++) {
                    plugin._buttonevent[plugin._options.buttons[i]['bmtype']] = plugin._options.buttons[i]['callback'];
                    $(dialogbd).find('ul').append('<li BMType="' + plugin._options.buttons[i]['bmtype'] + '"><span class="' + plugin._options.buttons[i]['iconcss'] + '"></span><span>' + plugin._options.buttons[i]['name'] + '</span></li>');
                }
                dialogwrp.append(dialoghd).append(dialogbd);
                $('body').append(dialogmask).append(dialogwrp);
            },
            /**
             *是否为function
             */
            isfunc: function (obj) {
                return typeof obj === 'function';
            },
            /**
             *判断插件是否已经渲染
             */
            isexist: function () {
                if ($('#' + plugin._thisattr.maskid).length == 0) {
                    return false;
                } else {
                    return true;
                }
            },
            /**
             *插件渲染
             */
            run: function () {
                if (!this.isexist()) {
                    this.renderwrp();
                    this.setcss();
                    this.bindevent();
                }
            }
        };
        /**
         *插件参数
         */
        plugin._thisattr = {
            /**
             * id
             */
            "id": "",
            /**
             * dialogid
             */
            "dialogid": "",
            /**
             * maskid
             */
            "maskid": "",
            /**
             * dialogheight
             */
            "dialogheight": 0,
            /**
             * 初始化参数
             */
            init: function () {
                this.id = $this.attr('id');
                this.dialogid = $this.attr('id');
                this.maskid = 'BMBottomToolMask_' + $this.attr('id');
            }
        };
        //初始化参数
        plugin._thisattr.init();
        //加载插件
        plugin._render.run();
    };
    //插件暴露的方法
    bmbottomtool.prototype = {
        show: function () {
            this._event.show();
        },
        close: function () {
            this._event.close();
        }
    };
    //将插件对象添加进jQuery中
    $.fn.bmbottomtool = function (options, params) {
        return this.each(function () {
            var ui = $(this).data('bmbottomtool');
            //如果还没有插件则创建
            if (!ui) {
                var ui = new bmbottomtool(this, $.extend(true, {}, $.fn.bmbottomtool.default, typeof options === "object" ? options : {}));
                $(this).data('bmbottomtool', ui);
            }
            // 执行插件的方法
            if (typeof options === "string" && typeof ui[options] == "function") {
                ui[options].call(ui, params);
            }

        });
    };
    //插件默认参数
    $.fn.bmbottomtool.default = {
        /**
         *按钮组标题
         */
        "title": "title1",
        /**
         *按钮
         */
        "buttons": []
    };
})(jQuery, window, document);
/*
 * 页面横向滑动tabpanel
 * 参数
 *  activeindex:当前活动的tab，默认为1
 *  height:panel内容高度(不包含上部导航)，可为cover(占满视口剩余高度)或数值(固定高度rem)，默认为cover
 *  navstyle：导航栏样式，可为cover(导航栏占满整个宽度)或uncover(导航栏不占满整个宽度)，默认为cover
 * 事件
 *  onTabChange:当切换tab切换后触发，传入参数为切换后的tabindex
 * 方法
 *  setActiveIndex：设置活动的tab，参数为需要切换到tabindex，如2
 *  
 */
(function ($, window, document) {
    //插件入口
    var bmtabpanel = function (element, options) {
        //当前dom对象
        var $this = $(element), plugin = this;
        //参数
        plugin._options = options;
        /**
         *事件
         */
        plugin._event = {
            setactiveindex: function (tabindex) {
                if (plugin._thisattr.activeindex != tabindex) {
                    plugin._thisattr.activeindex = tabindex;
                    plugin._render.seteventcss();
                    plugin._event.triggerTabChange();
                }
            },
            touchstart: function (e) {
                var touch = e.originalEvent.touches[0];
                plugin._thisattr.touchobj.istouchmove = 0;
                plugin._thisattr.touchobj.startPos = {x: touch.pageX, y: touch.pageY, time: +new Date};
                plugin._thisattr.touchobj.isScrolling = 0;
                plugin._thisattr.contentobj.find('ul').removeClass('bmtabpanel-swipe-transition');
                plugin._thisattr.navobj.find('.bmtabpanel-nav-bar').removeClass('bmtabpanel-swipe-transition');
            },
            touchmove: function (e) {
                if (e.originalEvent.touches.length > 1 || plugin._thisattr.touchobj.isScrolling == 1) {
                    return;
                }
                plugin._thisattr.touchobj.istouchmove = 1;
                var touch = e.originalEvent.touches[0];
                plugin._thisattr.touchobj.endPos = {x: touch.pageX - plugin._thisattr.touchobj.startPos.x, y: touch.pageY - plugin._thisattr.touchobj.startPos.y};
                plugin._thisattr.touchobj.isScrolling = Math.abs(plugin._thisattr.touchobj.endPos.x) < Math.abs(plugin._thisattr.touchobj.endPos.y) ? 1 : 0;
                if (plugin._thisattr.touchobj.isScrolling === 0) {
                    e.preventDefault();
                    //在最左边
                    if (plugin._thisattr.activeindex == 1 && plugin._thisattr.touchobj.endPos.x >= 0) {
                        return;
                    }
                    //在最右边
                    if (plugin._thisattr.activeindex == plugin._thisattr.tabs && plugin._thisattr.touchobj.endPos.x <= 0) {
                        return;
                    }
                    var newleft = -plugin._thisattr.clientwidth * (plugin._thisattr.activeindex - 1) + plugin._thisattr.touchobj.endPos.x;
                    var newleftbar = 0;
                    if (plugin._thisattr.navstyle == 'cover') {
                        newleftbar = (-plugin._thisattr.touchobj.endPos.x / plugin._thisattr.clientwidth) * plugin._thisattr.navBarWidth;
                        newleftbar = plugin._thisattr.navLiWidth * (plugin._thisattr.activeindex - 1) + Math.floor(newleftbar * 100) / 100;
                    } else {
                        newleftbar = (-plugin._thisattr.touchobj.endPos.x / plugin._thisattr.clientwidth) * plugin._thisattr.navBarWidth;
                        newleftbar = plugin._thisattr.navpadding + Math.floor((plugin._thisattr.navBarOuterWidth * (1 - plugin._thisattr.navpercent) / 2) * 100) / 100 + plugin._thisattr.navBarOuterWidth * (plugin._thisattr.activeindex - 1) + Math.floor(newleftbar * 100) / 100;
                    }

                    plugin._thisattr.contentobj.find('ul').css({'left': newleft + 'px'});
                    plugin._thisattr.navobj.find('.bmtabpanel-nav-bar').css({'left': newleftbar + '%'});
                }
            },
            touchend: function (e) {
                plugin._thisattr.contentobj.find('ul').addClass('bmtabpanel-swipe-transition');
                plugin._thisattr.navobj.find('.bmtabpanel-nav-bar').addClass('bmtabpanel-swipe-transition');
                if (plugin._thisattr.touchobj.istouchmove != 1) {
                    return;
                }
                var blnTabChange = false;
                var duration = +new Date - plugin._thisattr.touchobj.startPos.time;
                if (plugin._thisattr.touchobj.isScrolling === 0) {
                    if (Number(duration) > 100) {
                        //判断是左移还是右移，当偏移量>=3px时执行
                        if (plugin._thisattr.touchobj.endPos.x >= 3) {
                            if (plugin._thisattr.activeindex != 1) {
                                plugin._thisattr.activeindex -= 1;
                                blnTabChange = true;
                            }
                        } else if (plugin._thisattr.touchobj.endPos.x <= -3) {
                            if (plugin._thisattr.activeindex != plugin._thisattr.tabs) {
                                plugin._thisattr.activeindex += 1;
                                blnTabChange = true;
                            }
                        }
                    }
                }
                plugin._render.seteventcss();
                if (blnTabChange) {
                    plugin._event.triggerTabChange();
                }
            },
            triggerTabChange: function () {
                if (typeof plugin._options['onTabChange'] === 'function') {
                    plugin._options['onTabChange'](plugin._thisattr.activeindex);
                }
            }
        };
        /**
         *插件渲染
         */
        plugin._render = {
            /**
             *绑定事件
             */
            bindevent: function () {
                //tab点击
                plugin._thisattr.navobj.find('li a').each(function (tabindex) {
                    $(this).off('click').on('click', function () {
                        plugin._event.setactiveindex(tabindex + 1);
                    });
                });
                //tab移动
                plugin._thisattr.contentobj.off('touchstart').on('touchstart', function (e) {
                    plugin._event.touchstart(e);
                });
                plugin._thisattr.contentobj.off('touchmove').on('touchmove', function (e) {
                    plugin._event.touchmove(e);
                });
                plugin._thisattr.contentobj.off('touchend').on('touchend', function (e) {
                    plugin._event.touchend(e);
                });
            },
            /**
             *设置初始化样式
             */
            setinitcss: function () {
                if (plugin._thisattr.navstyle == 'cover') {
                    plugin._thisattr.navobj.css({'padding': ''});
                } else {
                    plugin._thisattr.navobj.css({'padding': '0 ' + plugin._thisattr.navpadding + '%'});
                }
                plugin._thisattr.navLiWidth = Math.floor((100 / plugin._thisattr.tabs) * 100) / 100;

                var contentUlWidth = plugin._thisattr.clientwidth * plugin._thisattr.tabs;
                var contentLiWidth = plugin._thisattr.clientwidth;

                $this.addClass('bmtabpanel');

                //plugin._thisattr.navobj.addClass('bmtabpanel-swipe-transition').addClass('bmtabpanel-nav');
                plugin._thisattr.navobj.addClass('bmtabpanel-nav');
                plugin._thisattr.navobj.find('li').css({'width': plugin._thisattr.navLiWidth + '%'});

                if (plugin._thisattr.navstyle == 'cover') {
                    plugin._thisattr.navBarOuterWidth = plugin._thisattr.navLiWidth;
                    plugin._thisattr.navBarWidth = plugin._thisattr.navLiWidth;
                } else {
                    plugin._thisattr.navBarOuterWidth = Math.floor(((100 - 2 * plugin._thisattr.navpadding) / plugin._thisattr.tabs) * 100) / 100;
                    plugin._thisattr.navBarWidth = Math.floor((plugin._thisattr.navBarOuterWidth * plugin._thisattr.navpercent) * 100) / 100;
                }
                plugin._thisattr.navobj.find('.bmtabpanel-nav-bar').css({'width': plugin._thisattr.navBarWidth + '%'});

                plugin._thisattr.contentobj.addClass('bmtabpanel-swipe');
                plugin._thisattr.contentobj.find('ul').addClass('bmtabpanel-swipe-transition').css({'width': contentUlWidth + 'px'});
                plugin._thisattr.contentobj.find('ul li').css({'width': contentLiWidth + 'px'});

                if (plugin._thisattr.height == 'cover') {
                    plugin._thisattr.contentobj.find('ul li').css({'height': ($(window).height() - $this.find('.bmtabpanel-swipe').offset().top) + 'px'});
                } else {
                    plugin._thisattr.contentobj.find('ul li').css({'height': plugin._thisattr.height + 'rem'});
                }
            },
            /**
             *设置事件样式
             */
            seteventcss: function () {
                plugin._thisattr.navobj.find('li').removeClass('active');
                plugin._thisattr.navobj.find('li').eq(plugin._thisattr.activeindex - 1).addClass('active');

                if (plugin._thisattr.navstyle == 'cover') {
                    plugin._thisattr.navobj.find('.bmtabpanel-nav-bar').css({'left': plugin._thisattr.navBarWidth * (plugin._thisattr.activeindex - 1) + '%'});
                } else {
                    var navleft = plugin._thisattr.navpadding + Math.floor((plugin._thisattr.navBarOuterWidth * (1 - plugin._thisattr.navpercent) / 2) * 100) / 100 + plugin._thisattr.navBarOuterWidth * (plugin._thisattr.activeindex - 1);
                    plugin._thisattr.navobj.find('.bmtabpanel-nav-bar').css({'left': navleft + '%'});
                }

                plugin._thisattr.contentobj.find('ul').css({'left': '-' + (plugin._thisattr.clientwidth * (plugin._thisattr.activeindex - 1)) + 'px'});
            },
            /**
             *弹出框外部主体
             */
            renderwrp: function () {
                plugin._thisattr.navobj.append('<div class="bmtabpanel-nav-bar"></div>');
            },
            /**
             *插件渲染
             */
            run: function () {
                this.renderwrp();
                this.setinitcss();
                this.seteventcss();
                this.bindevent();
            }
        };
        /**
         *插件参数
         */
        plugin._thisattr = {
            /**
             * 视口宽度
             */
            "clientwidth": 0,
            /**
             * 导航单个li占的百分比
             */
            navLiWidth: 0,
            /**
             * 导航滚动条占的百分比(外层)
             */
            navBarOuterWidth: 0,
            /**
             * 导航滚动条占的百分比(实际)
             */
            navBarWidth: 0,
            /**
             * 导航对象
             */
            navobj: null,
            /**
             * 内容对象
             */
            contentobj: null,
            /**
             * tab的个数
             */
            tabs: 1,
            /**
             *活动tab
             */
            "activeindex": 1,
            /**
             *tab内容高度
             */
            height: 20,
            /**
             *导航栏样式
             */
            navstyle: 'cover',
            navpadding: 5,
            navpercent: 0.8,
            /**
             *触摸移动对象
             */
            "touchobj": {},
            /**
             * 初始化参数
             */
            init: function () {
                this.clientwidth = $(window).width();
                this.navobj = $this.find('>ul');
                this.contentobj = $this.find('>div');
                this.tabs = this.navobj.find('li').length;
                this.activeindex = plugin._options['activeindex'];
                this.height = plugin._options['height'];
                this.navstyle = plugin._options['navstyle'];
            }
        };
        //初始化参数
        plugin._thisattr.init();
        //加载插件
        plugin._render.run();
    };
    //插件暴露的方法
    bmtabpanel.prototype = {
        setActiveIndex: function (tabindex) {
            this._event.setactiveindex(tabindex);
        }
    };
    //将插件对象添加进jQuery中
    $.fn.bmtabpanel = function (options, params) {
        return this.each(function () {
            var ui = $(this).data('bmtabpanel');
            //如果还没有插件则创建
            if (!ui) {
                var ui = new bmtabpanel(this, $.extend(true, {}, $.fn.bmtabpanel.default, typeof options === "object" ? options : {}));
                $(this).data('bmtabpanel', ui);
            }
            // 执行插件的方法
            if (typeof options === "string" && typeof ui[options] == "function") {
                ui[options].call(ui, params);
            }

        });
    };
    //插件默认参数
    $.fn.bmtabpanel.default = {
        /**
         *活动tab
         */
        "activeindex": 1,
        /**
         *tab内容高度
         */
        "height": 'cover',
        /**
         *导航栏样式
         */
        "navstyle": 'cover',
        /**
         *onTabChange
         */
        onTabChange: null
    };
})(jQuery, window, document);
/*
 * 页面左侧弹出框
 * 参数
 *  
 * 事件
 *  
 * 方法
 *  show:显示对话框
 *  close:关闭对话框 
 */
(function ($, window, document) {
    //插件入口
    var bmleftpanel = function (element, options) {
        //当前dom对象
        var $this = $(element), plugin = this;
        //参数
        plugin._options = options;
        /**
         *事件
         */
        plugin._event = {
            /**
             * 显示弹出框
             */
            show: function () {
                //恢复zindex
                $('#' + plugin._thisattr.dialogid).css({'z-index': 1004});
                $('#' + plugin._thisattr.maskid).css({'z-index': 1003});
                //显示
                $('#' + plugin._thisattr.maskid).fadeIn();
                $('#' + plugin._thisattr.dialogid).css({'-webkit-animation': 'leftpanelshow_' + plugin._thisattr.dialogid + ' 200ms linear forwards'});
            },
            /**
             * 关闭弹出框
             */
            close: function () {
                $('#' + plugin._thisattr.dialogid).css({'-webkit-animation': 'leftpanelhide_' + plugin._thisattr.dialogid + ' 200ms linear forwards'});
                $('#' + plugin._thisattr.maskid).fadeOut();
            },
            touchstart: function (e) {
                var touch = e.originalEvent.touches[0];
                plugin._thisattr.touchobj.istouchmove = 0;
                plugin._thisattr.touchobj.startPos = {x: touch.pageX, y: touch.pageY, time: +new Date};
                plugin._thisattr.touchobj.isScrolling = -1;
                $this.css({'-webkit-transform': 'translate(0px, 0px)', 'animation': ''});
            },
            touchmove: function (e) {
                if (e.originalEvent.touches.length > 1 || plugin._thisattr.touchobj.isScrolling == 1) {
                    return;
                }
                plugin._thisattr.touchobj.istouchmove = 1;
                var touch = e.originalEvent.touches[0];
                plugin._thisattr.touchobj.endPos = {x: touch.pageX - plugin._thisattr.touchobj.startPos.x, y: touch.pageY - plugin._thisattr.touchobj.startPos.y};
                plugin._thisattr.touchobj.isScrolling = plugin._thisattr.touchobj.isScrolling == 0 ? plugin._thisattr.touchobj.isScrolling : (Math.abs(plugin._thisattr.touchobj.endPos.x) < Math.abs(plugin._thisattr.touchobj.endPos.y) ? 1 : 0);
                if (plugin._thisattr.touchobj.isScrolling === 0) {
                    e.preventDefault();
                    //在最左边
                    if (plugin._thisattr.touchobj.endPos.x <= -plugin._thisattr.dialogwidth) {
                        plugin._thisattr.touchobj.endPos.x = -plugin._thisattr.dialogwidth;
                    }
                    //在最右边
                    if (plugin._thisattr.touchobj.endPos.x >= 0) {
                        plugin._thisattr.touchobj.endPos.x = 0;
                    }
                    plugin._thisattr.touchobj.currentwidth = plugin._thisattr.touchobj.currentwidth + plugin._thisattr.touchobj.endPos.x;
                    $this.css({'-webkit-transform': 'translate(' + plugin._thisattr.touchobj.endPos.x + 'px, 0px)'});
                }
            },
            touchend: function (e) {
                if (plugin._thisattr.touchobj.istouchmove == 1 && plugin._thisattr.touchobj.isScrolling == 0) {
                    var duration = +new Date - plugin._thisattr.touchobj.startPos.time;
                    if (plugin._thisattr.touchobj.isScrolling === 0) {
                        if (Number(duration) > 100) {
                            //判断是关闭还是恢复原状
                            //添加变化样式
                            $('#' + plugin._thisattr.dialogid + '_move').remove();
                            var style = $('<style></style>').attr({'id': plugin._thisattr.dialogid + '_move', 'type': 'text/css'});
                            var keyFrames = '';
                            var blnClose = false;
                            if (plugin._thisattr.touchobj.endPos.x <= -plugin._thisattr.dialogwidth / 5) {
                                blnClose = true;
                                keyFrames = '\
                                    @-webkit-keyframes leftpanelmove_' + plugin._thisattr.dialogid + '{' +
                                        '0% {\
                                            -webkit-transform: translate(' + plugin._thisattr.touchobj.endPos.x + 'px,0px);\
                                        }' +
                                        '100% {\
                                            -webkit-transform: translate(' + (-plugin._thisattr.dialogwidth) + 'px,0px);\
                                        }\
                                    }';
                            } else {
                                keyFrames = '\
                                    @-webkit-keyframes leftpanelmove_' + plugin._thisattr.dialogid + '{' +
                                        '0% {\
                                            -webkit-transform: translate(' + plugin._thisattr.touchobj.endPos.x + 'px,0px);\
                                        }' +
                                        '100% {\
                                            -webkit-transform: translate(0px,0px);\
                                        }\
                                    }';
                            }
                            style.html(keyFrames);
                            $('head').append(style);
                            $('#' + plugin._thisattr.dialogid).css({'-webkit-transform': '', '-webkit-animation': 'leftpanelmove_' + plugin._thisattr.dialogid + ' 200ms linear forwards'});
                            if (blnClose) {
                                $('#' + plugin._thisattr.maskid).fadeOut();
                            }
                        }
                    }
                }
            }
        };
        /**
         *插件渲染
         */
        plugin._render = {
            /**
             *绑定事件
             */
            bindevent: function () {
                //点击mask关闭
                $('#' + plugin._thisattr.maskid).off('click').on('click', function () {
                    plugin._event.close();
                });
                //tab移动
                $this.off('touchstart').on('touchstart', function (e) {
                    plugin._event.touchstart(e);
                });
                $this.off('touchmove').on('touchmove', function (e) {
                    plugin._event.touchmove(e);
                });
                $this.off('touchend').on('touchend', function (e) {
                    plugin._event.touchend(e);
                });
            },
            /**
             *设置样式
             */
            setcss: function () {
                //记录按钮组高度                
                plugin._thisattr.dialogwidth = $('#' + plugin._thisattr.dialogid).outerWidth();
                //添加变化样式
                $('#leftpanel_' + plugin._thisattr.dialogid).remove();
                var style = $('<style></style>').attr({'id': 'leftpanel_' + plugin._thisattr.dialogid, 'type': 'text/css'});
                var keyFrames = '\
                    @-webkit-keyframes leftpanelshow_' + plugin._thisattr.dialogid + '{' +
                        '0% {\
                            -webkit-transform: translate(' + (-plugin._thisattr.dialogwidth) + 'px,0px);\
                        }' +
                        '100% {\
                            -webkit-transform: translate(0px,0px);\
                        }\
                    }\
                    @-webkit-keyframes leftpanelhide_' + plugin._thisattr.dialogid + '{' +
                        '0% {\
                             -webkit-transform: translate(0px,0px);\
                        }' +
                        '100% {\
                            -webkit-transform: translate(' + (-plugin._thisattr.dialogwidth) + 'px,0px);\
                        }\
                    }';
                style.html(keyFrames);
                $('head').append(style);
            },
            /**
             *设置初始样式
             */
            setinitcss: function () {
                //设置组件初始样式
                $('#' + plugin._thisattr.dialogid).css({'-webkit-transform': 'translate(' + (-plugin._thisattr.dialogwidth) + 'px,0px)', 'display': 'block'});
                //设置zindex=-1执行模拟显示与关闭
                $('#' + plugin._thisattr.dialogid).css({'z-index': -1});
                $('#' + plugin._thisattr.maskid).css({'z-index': -1});
                //模拟第一次显示
                $('#' + plugin._thisattr.maskid).fadeIn(1);
                $('#' + plugin._thisattr.dialogid).css({'-webkit-animation': 'leftpanelshow_' + plugin._thisattr.dialogid + ' 200ms linear forwards'});
                //模拟第一次关闭
                setTimeout(function () {
                    $('#' + plugin._thisattr.dialogid).css({'-webkit-animation': 'leftpanelhide_' + plugin._thisattr.dialogid + ' 200ms linear forwards'});
                    $('#' + plugin._thisattr.maskid).fadeOut(1);
                }, 200);
            },
            /**
             *弹出框外部主体
             */
            renderwrp: function () {
                var dialogmask = $('<div class="BMLeftPanelLay"></div>').attr({"id": plugin._thisattr.maskid});
                var dialogwrp = $this.addClass('BMLeftPanel');
                $('body').append(dialogmask).append(dialogwrp);
            },
            /**
             *是否为function
             */
            isfunc: function (obj) {
                return typeof obj === 'function';
            },
            /**
             *判断插件是否已经渲染
             */
            isexist: function () {
                if ($('#' + plugin._thisattr.maskid).length == 0) {
                    return false;
                } else {
                    return true;
                }
            },
            /**
             *插件渲染
             */
            run: function () {
                if (!this.isexist()) {
                    this.renderwrp();
                    this.setcss();
                    this.setinitcss();
                    this.bindevent();
                }
            }
        };
        /**
         *插件参数
         */
        plugin._thisattr = {
            /**
             * id
             */
            "id": "",
            /**
             * dialogid
             */
            "dialogid": "",
            /**
             * maskid
             */
            "maskid": "",
            /**
             * dialogheight
             */
            "dialogwidth": 0,
            /**
             *触摸移动对象
             */
            "touchobj": {},
            /**
             * 初始化参数
             */
            init: function () {
                this.id = $this.attr('id');
                this.dialogid = $this.attr('id');
                this.maskid = 'BMLeftPanelMask_' + $this.attr('id');
            }
        };
        //初始化参数
        plugin._thisattr.init();
        //加载插件
        plugin._render.run();
    };
    //插件暴露的方法
    bmleftpanel.prototype = {
        show: function () {
            this._event.show();
        },
        close: function () {
            this._event.close();
        }
    };
    //将插件对象添加进jQuery中
    $.fn.bmleftpanel = function (options, params) {
        return this.each(function () {
            var ui = $(this).data('bmleftpanel');
            //如果还没有插件则创建
            if (!ui) {
                var ui = new bmleftpanel(this, $.extend(true, {}, $.fn.bmleftpanel.default, typeof options === "object" ? options : {}));
                $(this).data('bmleftpanel', ui);
            }
            // 执行插件的方法
            if (typeof options === "string" && typeof ui[options] == "function") {
                ui[options].call(ui, params);
            }

        });
    };
    //插件默认参数
    $.fn.bmleftpanel.default = {
    };
})(jQuery, window, document);
/*
 * 列表插件
 * 参数
 *  ajaxurl:ajax调用地址
 *  viewgroup:列表对应的视图,默认为空
 *  pagesize:第一次显示或每次加载的数据条数,默认为10
 *  loadfirst:列表首次加载时，是否加载数据，默认加载
 *  listparam:列表初始条件，默认为空
 *  height:列表高度，可为cover(占满视口剩余高度)或数值(固定高度rem)，默认为cover
 *  needloading:是否需要加载动画，默认为是
 * 事件
 *  onReady:列表数据加载完成后调用，有分页的话每次加载完分页数据也会调用
 *  onRender:列表渲染时调用，用于对每条加载数据进行模板样式渲染
 * 方法
 *  refresh(param):根据条件刷新当前列表数据，数据开始行会从0开始
 *  getlistdata(param):获取列表数据源的数据，param格式为{"index": 行号, "fieldname": '列名'}
 */
(function ($, window, document) {
    //插件入口
    var bmdatalist = function (element, options) {
        //当前dom对象
        var $this = $(element), plugin = this;
        //参数
        plugin._options = options;
        /**
         *数据获取
         */
        plugin._data = {
            /**
             *获取post参数
             */
            getparam: function () {
                var param = {};
                param.optype = 'loadlist';
                param.divid = plugin._thisattr.id;
                param.viewgroup = plugin._thisattr.viewgroup;
                param.pagesize = plugin._thisattr.pagesize;
                param.pagestart = plugin._thisattr.pagestart;
                param.listparam = JSON.stringify(plugin._thisattr.listparam);
                return param;
            },
            /**
             *通过ajax获取数据
             */
            getdata: function () {
                if (!plugin._thisattr.datalistprevent) {
                    plugin._thisattr.datalistprevent = true;
                    var postparam = this.getparam();
                    plugin._event.showloading();
                    $.bmajax.ajax({
                        url: plugin._thisattr.ajaxurl,
                        data: postparam,
                        success: function (data) {
                            plugin._event.hideloading();
                            if (data && data["thisattr"]) {
                                plugin._thisattr.init(data["thisattr"]);
                            }
                            if (data && data["data"]) {
                                plugin._render.renderdata(data["data"]);
                            }
                        },
                        complete: function () {
                            plugin._event.hideloading();
                            plugin._thisattr.datalistprevent = false;
                        }
                    });
                }
            }
        };
        /**
         *事件
         */
        plugin._event = {
            /**
             *获取列表数据源的数据
             */
            getlistdata: function (param) {
                if (!$this.data('listdata')) {
                    return '';
                }
                var value = $.grep($this.data('listdata'), function (obj, i) {
                    return obj['trindex'] == param['index'];
                });
                if (value && value[0] && typeof value[0][param['fieldname'].toLowerCase()] !== "undefined") {
                    return value[0][param['fieldname'].toLowerCase()];
                } else {
                    return '';
                }
            },
            /**
             *列表滚动
             */
            scroll: function () {
                //滚动到底部加载下一页数据
                if ($this.scrollTop() + $this.innerHeight() + 30 >= $this.find('ul').outerHeight() && plugin._thisattr.datalistmove) {
                    //加载数据，标记此次滚动失效
                    plugin._thisattr.datalistmove = false;
                    plugin._render.getdata();
                }
            },
            /**
             *显示加载等待动画
             */
            showloading: function () {
                if (!plugin._thisattr.needloading) {
                    return;
                }
                if (plugin._thisattr.pagestart == 0) {
                    $this.find('.loading').css({'border-top': ''});
                } else {
                    $this.find('.loading').css({'border-top': '0.1rem solid #e6e6e6'});
                }
                $this.find('.loading').show();
            },
            /**
             *隐藏加载等待动画
             */
            hideloading: function () {
                $this.find('.loading').hide();
            },
            /**
             *列表触摸开始
             */
            datalisttouchstart: function (e) {
                plugin._thisattr.datalistmove = true;
                var touch = e.originalEvent.touches[0];
                plugin._thisattr.touchobj.startPos = {x: touch.pageX, y: touch.pageY, time: +new Date};
            },
            /**
             *列表触摸移动
             */
            datalisttouchmove: function (e) {
                var touch = e.originalEvent.touches[0];
                plugin._thisattr.touchobj.endPos = {x: touch.pageX - plugin._thisattr.touchobj.startPos.x, y: touch.pageY - plugin._thisattr.touchobj.startPos.y};
                //滚动条已经在最底部，且move的距离超过40
                if ($this.scrollTop() + $this.innerHeight() >= $this.find('ul').outerHeight() && plugin._thisattr.datalistmove && plugin._thisattr.touchobj.endPos.y <= -20) {
                    //加载数据，标记此次滚动失效
                    plugin._thisattr.datalistmove = false;
                    plugin._render.getdata();
                }
            },
            /**
             *列表触摸结束
             */
            datalisttouchend: function () {
                plugin._thisattr.datalistmove = false;
            }
        };
        /**
         *插件渲染
         */
        plugin._render = {
            /**
             *列表数据
             */
            "data": null,
            /**
             *获取列表数据
             */
            getdata: function () {
                if (plugin._thisattr.loadfirst) {
                    plugin._data.getdata();
                } else {
                    plugin._thisattr.loadfirst = true;
                }
            },
            /**
             *初始化一些样式
             */
            rendercss: function () {
                $this.addClass('bmdatalist').append('<ul></ul>').append('<div class="loading"><div class="rect1">&nbsp;</div><div class="rect2">&nbsp;</div><div class="rect3">&nbsp;</div><div class="rect4">&nbsp;</div><div class="rect5">&nbsp;</div></div>');
                if (plugin._thisattr.height == 'cover') {
                    $this.css({'height': ($(window).height() - $this.offset().top) + 'px'});
                } else {
                    $this.css({'height': plugin._thisattr.height + 'rem'});
                }
            },
            /**
             *数据渲染
             */
            renderdata: function (returndata) {
                plugin._render.data = returndata;
                if (plugin._render.data['errmsg'] !== '') {
                    //数据加载错误
                    $.bmtips.show(this.data['errmsg']);
                } else {
                    if (plugin._render.data['data']) {
                        //数据解析 
                        var objdata = $.parseJSON(plugin._render.data['data']);
                        //缓存数据
                        var tmpcachedata = $this.data('listdata') ? $this.data('listdata') : [];
                        $this.removeData('listdata');
                        //循环渲染数据
                        $.each(objdata, function (index, rowdata) {
                            index = plugin._thisattr.pagestart + 1;
                            rowdata['trindex'] = index;
                            tmpcachedata.push(rowdata);
                            if (typeof plugin._thisattr.onrender === 'function') {
                                var lidata = plugin._thisattr.onrender(index, rowdata);
                                $this.find('ul').append($('<li></li>').attr('trindex', index).append(lidata));
                            }
                            plugin._thisattr.pagestart++;
                        });
                        $this.data('listdata', tmpcachedata);
                        this.onready();
                    }
                }
            },
            /**
             * 事件绑定
             */
            bindevent: function () {
                //列表滚动
                $this.off('scroll').on('scroll', function () {
                    plugin._event.scroll();
                });
                //列表触摸开始
                $this.off('touchstart').on('touchstart', function (e) {
                    plugin._event.datalisttouchstart(e);
                });
                //列表触摸移动
                $this.off('touchmove').on('touchmove', function (e) {
                    plugin._event.datalisttouchmove(e);
                });
                //列表触摸结束
                $this.off('touchend').on('touchend', function () {
                    plugin._event.datalisttouchend();
                });
            },
            /**
             * 列表加载完成后执行
             */
            onready: function () {
                //如果有传入方法
                if (typeof plugin._thisattr.onready === 'function') {
                    plugin._thisattr.onready();
                }
            },
            /**
             *渲染列表
             */
            run: function () {
                this.rendercss();
                this.bindevent();
            }
        };
        /**
         *插件参数
         */
        plugin._thisattr = {
            /**
             * 列表ID
             */
            "id": "",
            /**
             * 每页条数
             */
            "pagesize": 10,
            /**
             * 查询开始位置
             */
            "pagestart": 0,
            /**
             * 数据总数
             */
            "total": 0,
            /**
             * 视图
             */
            "viewgroup": "",
            /**
             * ajax调用地址
             */
            "ajaxurl": '',
            /**
             * 列表首次加载时，是否加载数据
             */
            "loadfirst": true,
            /**
             *列表高度
             */
            "height": 'cover',
            /**
             *是否需要加载动画
             */
            "needloading": true,
            /**
             *数据列表是否有移动
             */
            "datalistmove": false,
            /**
             *列表加载阻塞，调用加载数据成功后才能执行下一次加载
             */
            "datalistprevent": false,
            /**
             *触摸移动对象
             */
            "touchobj": {},
            /**
             * 列表加载完成后调用
             */
            "onready": null,
            /**
             * 数据加载完，列表渲染前调用
             */
            "onrender": null,
            /**
             * 列表查询条件
             */
            "listparam": {},
            /**
             * 总页数
             */
            pagecount: function () {
                return this.pagesize === -1 ? 1 : (this.total % this.pagesize == 0 ? this.total / this.pagesize : parseInt(this.total / this.pagesize) + 1);
            },
            /**
             * 初始化列表运行参数
             */
            init: function (option) {
                if (option) {
                    this.total = typeof (option['total']) !== "undefined" ? option['total'] : this.total;
                } else {
                    this.id = $this.attr("id");
                    this.pagesize = plugin._options.pagesize;
                    this.viewgroup = plugin._options.viewgroup;
                    this.ajaxurl = plugin._options.ajaxurl;
                    this.onready = plugin._options.onReady;
                    this.onrender = plugin._options.onRender;
                    this.loadfirst = plugin._options.loadfirst;
                    this.height = plugin._options.height;
                    this.needloading = plugin._options.needloading;
                    this.listparam = $.extend(true, {}, this.listparam, typeof plugin._options.listparam === "object" ? plugin._options.listparam : {});
                }
            }
        };
        //初始化参数
        plugin._thisattr.init();
        //初始化插件
        plugin._render.run();
        //加载数据
        plugin._render.getdata();
    };

    //插件暴露的方法
    bmdatalist.prototype = {
        refresh: function (listparam) {
            this._thisattr.listparam = $.extend(true, {}, this._thisattr.listparam, typeof listparam === "object" ? listparam : {});
            this._thisattr.pagestart = 0;
            $('#' + this._thisattr.id + ' ul').empty();
            this._render.getdata();
        },
        getlistdata: function (param) {
            return this._event.getlistdata(param);
        }
    };

    //将插件对象添加进jQuery中
    $.fn.bmdatalist = function (options, listparam) {
        //如果是执行方法
        if (typeof options === "string") {
            if ($(this).size() <= 0) {
                return '';
            }
            //返回第一个匹配项的值
            var ui = $(this[0]).data('bmdatalist');
            if (ui && typeof ui[options] === "function") {
                return ui[options].call(ui, listparam);
            }
        }
        return this.each(function () {
            var ui = $(this).data('bmdatalist');
            //如果还没有插件则创建
            if (!ui) {
                var ui = new bmdatalist(this, $.extend(true, {}, $.fn.bmdatalist.default, typeof options === "object" ? options : {}));
                $(this).data('bmdatalist', ui);
            }
        });
    };

    //插件默认参数
    $.fn.bmdatalist.default = {
        /*
         * 列表对应的视图
         * 默认为空
         */
        "viewgroup": "",
        /*
         * 第一次显示或每次加载的数据条数,默认为10
         */
        "pagesize": 10,
        /**
         * 列表首次加载时，是否加载数据
         */
        "loadfirst": true,
        /**
         *列表高度
         */
        "height": 'cover',
        /**
         *是否需要加载动画
         */
        "needloading": true,
        /*
         * ajax调用地址，默认为空
         */
        "ajaxurl": "",
        /**
         * 列表数据加载完成后调用，有分页的话每次加载完分页数据也会调用
         */
        "onReady": null,
        /**
         * 列表渲染时调用，用于对每条加载数据进行样式渲染
         */
        "onRender": null,
        /**
         * 列表条件
         */
        listparam: {}
    };

})(jQuery, window, document);
/*
 * 下拉选择弹框bmselect
 * 参数
 *  seldata:对象数组
 *  type:类型 【select/ datetime】
 *  id:点击对象的id值
 * 事件
 *
 */
(function ($, window, document) {
    var _bmselect = function (option) {
        //当前dom对象
        var $this = $("#ml"), plugin = this;
        //默认参数
        plugin._default = {
            selclass: 'bmselect',
            step: 40,
            type: '',
            selholder: '',
            defaultVal: '',
            zIndex: 1000,
            surebtntext: '确定',
            cancelbtntext: '取消',
            onBeforeSure: null,
            onSure: null,
            onCancel: null,
            //date参数
            "dateWheels": "yy mm dd DD hh ss",
            yeartext: '年',
            monthtext: '月',
            daytext: '日',
            weektext: '周',
            hourtext: '时',
            secondtext: '分',
            loopitem: ['month', 'date', 'hour', 'second']


        };
        //参数
        plugin._options = $.extend(true, {}, plugin._default, typeof option === "object" ? option : {});
        /**
         *插件参数
         */
        plugin._thisattr = {
            /**
             * id
             */
            "id": "",
            /**
             * 初始化参数
             */
            init: function () {
                this.id = $this.attr('id');
            }
        };
        /**
         *事件
         */
        plugin._event = {
            /**
             * 显示选择框
             */
            show: function () {
                $(".ml-select").show();
                $(".ml-select .ml").animate({'height': '245px'}, 'fast', 'linear');
            },
            /**
             * 关闭选择框
             */
            close: function () {
                $(".ml-select").hide();
                $(".ml-select .ml").animate({'height': '0px'}, 'fast', 'linear');
                $(".ml-select").remove();
            },
            getTranslate: function (id) {
                if (typeof id != "undefined") {
                    var translates = document.defaultView.getComputedStyle(document.getElementById(id + "-ul"), null).transform.substring(7).split(',');
                    return parseFloat(translates[5]);
                }
            },
            /**
             * 获取触摸对象id
             */
            getHandler: function (ev)
            {
                return $(ev.target).closest('.mlc-item').attr('id'); // 当鼠标移出Div1时，会弹出提示框提示鼠标移动到的另一个元素的ID
            },
            /*循环位置判断*/
            loopChange: function (id) {
                //排除mm月dd日类型
                if (id == "month" && !$("#year").length) {
                    return;
                }
                if ($("#" + id).length && plugin._options['loopitem'].indexOf(id) != -1) {
                    var step = plugin._options['step'];
                    var h = $("#" + id + ' .mlc-ul-i').height();
                    var movey = plugin._event.getTranslate(id);
                    //上滚
                    if (movey <= 2 * step && movey >= 0) {
                        var i = 2 - movey / step;
                        var y = movey - h;
                        $("#" + id).find('.mlc-ul').css({'-webkit-transform': 'translate(0px,' + y + 'px)'});
                        $("#" + id).find('.mlc-li').attr('ml-selected', 'false');
                        $($("#" + id).find('.mlc-ul-i').eq(1)).find('.mlc-li').eq(i).attr('ml-selected', 'true');
                    }
                    //下滚
                    if (-movey >= h && movey < 0) {
                        if (Math.abs(movey) - h == 0) {
                            var i = 2;
                        } else {
                            var i = (Math.abs(movey) - h) / step + 2;
                        }
                        var y = movey + h;
                        $("#" + id).find('.mlc-ul').css({'-webkit-transform': 'translate(0px,' + y + 'px)'});
                        $("#" + id).find('.mlc-li').attr('ml-selected', 'false');
                        $($("#" + id).find('.mlc-ul-i').eq(0)).find('.mlc-li').eq(i).attr('ml-selected', 'true');
                    }
                }

            }
        };
        /**
         * 日期
         */

        plugin._datetime = {
            getParam: function (dateobj) {
                //定义当前日期 y:年 m:月 d:日  fw:所属星期 per_month_days:每月天数
                var y = dateobj.getFullYear(),
                        m = dateobj.getMonth(),
                        d = dateobj.getDate(),
                        fw = dateobj.getDay()

            },
            //根据年月返回每月天数
            getDays: function (y, m) {
                var per_month_days = new Array(31, 28 + plugin._datetime.isLeap(y), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
                return per_month_days[m];
            },
            //根据年月日返回星期数
            getWeek: function (y, m, d) {
                var weekstr = ['日', '一', '二', '三', '四', '五', '六'];
                return weekstr[new Date(y, m, d).getDay()];
            },
            //无年份(格式xx月xx日)选择动态滚动
            loadmdStr: function (val) {//val 为年份
                var initVal = val;
                //最大最小值处理
                var data = plugin._options['seldata'];
                var minm = 1, mind = 1, maxm = 12, maxd = 31;
                if ($.trim(data.minDate).length && plugin._datetime.getDateType(data.minDate).getFullYear() == new Date().getFullYear()) {
                    var min_date = plugin._datetime.getDateType(data.minDate);
                    minm = min_date.getMonth() + 1;
                    mind = min_date.getDate();
                }
                if ($.trim(data.maxDate).length && plugin._datetime.getDateType(data.maxDate).getFullYear() == new Date().getFullYear()) {
                    var max_date = plugin._datetime.getDateType(data.maxDate);
                    maxm = max_date.getMonth() + 1;
                    maxd = max_date.getDate();
                }

                if (!$("#" + val).length) {
                    var data = plugin._options['seldata'];
                    var selbd = '<div class="year-item" id="' + initVal + '" pre-data="' + initVal + '">';
                    for (var i = minm; i <= maxm; i++) {
                        selbd += '<div class="mlc-ul-i">';
                        for (var j = 1; j <= plugin._datetime.getDays(initVal, i - 1); j++) {
                            if ((i == minm && j < mind) || (i == maxm && j > maxd)) {
                                continue;
                            }
                            var md = '', md_val = initVal + '-';
                            data.dateWheels.indexOf('mm') != -1 ? (md += (i < 10 ? '0' + i : i) + plugin._options['monthtext']) : md;
                            data.dateWheels.indexOf('dd') != -1 ? (md += (j < 10 ? '0' + j : j) + plugin._options['daytext']) : md;
                            data.dateWheels.indexOf('DD') != -1 ? (md += plugin._options['weektext'] + plugin._datetime.getWeek(initVal, i - 1, j)) : md;
                            data.dateWheels.indexOf('mm') != -1 ? data.dateWheels.indexOf('dd') != -1 ? (md_val += (i < 10 ? '0' + i : i) + '-' + (j < 10 ? '0' + j : j)) : (md_val += (j < 10 ? '0' + j : j)) : (md_val += (i < 10 ? '0' + i : i));
                            selbd += '<div role="option" class="mlc-li" style="line-height:' + plugin._options['step'] + 'px" ml-selected="false" data-val="' + md_val + '"><div class="mlc-i">' + md + '</div></div>';
                        }
                        selbd += '</div>';
                    }
                    selbd += '</div>';
                    return selbd;
                } else {
                    return false;
                }

            },
            refreshMd: function () {
                //判断是否需要继续加载 格式xx月xx日
                var data = plugin._options['seldata'];
                if (!$("#year").length && $("#month").length && !$("#date").length) {
                    if ($("#month").attr('data-val').split('-').length == 3) {
                        //当值为11月份时加载下一年
                        var md = $("#month").attr('data-val').split('-');
                        if (!$.trim(data.maxDate).length) {
                            if (parseInt(md[1]) >= 11) {
                                if (plugin._datetime.loadmdStr(parseInt(md[0]) - 1) != false) {
                                    $("#month-ul").append(plugin._datetime.loadmdStr(parseInt(md[0]) + 1));
                                }
                            }
                        }
                        if (!$.trim(data.minDate).length) {
                            if (parseInt(md[1]) <= 2) {
                                plugin._datetime.loadmdStr(parseInt(md[0]) - 1);
                                if (plugin._datetime.loadmdStr(parseInt(md[0]) - 1) != false) {
                                    $("#month-ul").find(".year-item").eq(0).before(plugin._datetime.loadmdStr(parseInt(md[0]) - 1));
                                    var y = plugin._event.getTranslate("month") - $("#" + (parseInt(md[0]) - 1)).height();
                                    $("#month-ul").css({'-webkit-transform': 'translate(0px,' + y + 'px)'});
                                }

                            }
                        }
                    }
                }


            },
            //根据选择的年月更新日期天数
            refreshDays: function () {
                if ($("#year").length && $("#month").length && $("#date").length) {
                    var y = $("#year").attr('data-val');
                    var m = $("#month").attr('data-val');
                    var d = $("#date").attr('data-val');
                    var days = plugin._datetime.getDays(y, parseInt(m) - 1);
                    $("#date-ul .mlc-li").removeClass('mlc-hidden');
                    $.each($("#date-ul .mlc-ul-i"), function (i) {
                        for (var i = days; i < 31; i++) {
                            $(this).find('.mlc-li').eq(i).addClass('mlc-hidden');
                        }
                    });

                    if (plugin._options['loopitem'].indexOf('date') != -1) {
                        var dis = plugin._event.getTranslate("date");
                        $(".mlc-hidden").each(function (i) {
                            if ($(this).attr('ml-selected') == "true") {
                                var y = dis + (i + 1) * plugin._options['step'];
                                $("#date-ul").css({'-webkit-transform': 'translate(0px,' + y + 'px)'});
                                $("#date-ul .mlc-li").attr("ml-selected", "false");
                                $("#date-ul .mlc-li").eq(days - 1).attr("ml-selected", "true");
                            }
                        });

                    } else {
                        var dis = $("#date-ul").height() - plugin._options['step'] * 3;
                        if (dis <= -plugin._event.getTranslate("date")) {
                            $("#date-ul").css({'-webkit-transform': 'translate(0px,-' + dis + 'px)'});
                            $("#date-ul .mlc-li").attr("ml-selected", "false");
                            $("#date-ul .mlc-li").eq((dis / plugin._options['step']) + 2).attr("ml-selected", "true");
                            $("#date").attr('data-val', $("#date-ul .mlc-li").eq((dis / plugin._options['step']) + 2).attr('data-val'));
                        }
                    }
                }
            },
            createDateDom: function () {//创建dom结构
                //初始化值
                var initVal;
                if (!$.trim($("#" + plugin._options['id']).attr('data-val')).length) {
                    if ($.trim(plugin._options['defaultVal']).length) {
                        initVal = new Date(plugin._options['defaultVal']);
                    } else {
                        initVal = new Date();
                    }

                } else {
                    var selVal = $("#" + plugin._options['id']).attr('data-val').split(',');
                    var y = selVal[0], m = parseInt(selVal[1].split('-')[0]) - 1, d = selVal[1].split('-')[1], h = selVal[2], s = selVal[3];
                    initVal = new Date(y, m, d, h, s);
                }
                var data = plugin._options['seldata'];
                var miny = 0, maxy = 0;
                if (data.dateWheels.indexOf('yy') != -1) {
                    if ($.trim(data.minDate) != '' && $.trim(data.maxDate) != '') {
                        miny = plugin._datetime.getDateType(data.minDate).getFullYear();
                        maxy = plugin._datetime.getDateType(data.maxDate).getFullYear();
                    } else if ($.trim(data.minDate) == '' && $.trim(data.maxDate) != '') {
                        miny = new Date().getFullYear();
                        maxy = plugin._datetime.getDateType(data.maxDate).getFullYear();
                    } else if ($.trim(data.minDate) == '' && $.trim(data.maxDate) == '') {
                        miny = 0;
                        maxy = 0;
                    }
                    if (miny != 0 && maxy != 0) {
                        var selbd = ' <div class="mlc-item mlc-item-year"  id="year"><div class="label">' + plugin._options['yeartext'] + '</div><div class="mlc-ul" id="year-ul"><div class="mlc-ul-i">';
                        for (var i = 0; i <= (maxy - miny); i++) {
                            selbd += '<div role="option" class="mlc-li" ml-selected="false" data-val="' + (miny + i) + '"><div class="mlc-i">' + (miny + i) + '</div></div>';
                        }
                        selbd += '</div></div></div>';
                        $('.mlc').append(selbd);
                    } else {
                        var selbd = ' <div class="mlc-item mlc-item-year"  id="year"><div class="label">' + plugin._options['yeartext'] + '</div><div class="mlc-ul" id="year-ul"><div class="mlc-ul-i">';
                        for (var i = 0; i <= 1; i++) {
                            selbd += '<div role="option" class="mlc-li" ml-selected="false" data-val="' + (new Date().getFullYear() + i) + '"><div class="mlc-i">' + (new Date().getFullYear() + i) + '</div></div>';
                        }
                        selbd += '</div></div></div>';
                        $('.mlc').append(selbd);
                    }
                    if (data.dateWheels.indexOf('mm') != -1) {
                        var selbd = ' <div class="mlc-item mlc-item-month"  id="month"><div class="label">' + plugin._options['monthtext'] + '</div><div class="mlc-ul" id="month-ul"><div class="mlc-ul-i">';
                        for (var i = 1; i <= 12; i++) {
                            selbd += '<div role="option" class="mlc-li" ml-selected="false" data-val="' + (i < 10 ? '0' + i : i) + '"><div class="mlc-i">' + (i < 10 ? '0' + i : i) + '</div></div>';
                        }
                        selbd += '</div></div></div>';
                        $('.mlc').append(selbd);
                        if (plugin._options['loopitem'].indexOf('month') != -1) {
                            $("#month-ul").append($('#month-ul').html());
                        }
                        ;
                    }
                    if (data.dateWheels.indexOf('dd') != -1 || data.dateWheels.indexOf('DD') != -1) {
                        var selbd = ' <div class="mlc-item mlc-item-date"  id="date"><div class="label">' + plugin._options['daytext'] + '</div><div class="mlc-ul" id="date-ul"><div class="mlc-ul-i">';
                        for (var i = 1; i <= 31; i++) {
                            selbd += '<div role="option" class="mlc-li" ml-selected="false" data-val="' + (i < 10 ? '0' + i : i) + '"><div class="mlc-i">' + (i < 10 ? '0' + i : i) + '<span class="mlc-week"></span></div></div>';
                        }
                        selbd += '</div></div></div>';
                        $('.mlc').append(selbd);
                        if (plugin._options['loopitem'].indexOf('date') != -1) {
                            $("#date-ul").append($('#date-ul').html());
                        }
                        ;

                    }


                } else {

                    if (data.dateWheels.indexOf('mm') != -1 && data.dateWheels.indexOf('dd') != -1 || data.dateWheels.indexOf('DD') != -1) {
                        var selbd = ' <div class="mlc-item mlc-item-month"  id="month"><div class="mlc-ul" id="month-ul">';
                        selbd += plugin._datetime.loadmdStr(initVal.getFullYear());
                        selbd += '</div>';
                        $('.mlc').append(selbd);
                    }

                }
                if (data.dateWheels.indexOf('hh') != -1) {
                    var selbd = ' <div class="mlc-item mlc-item-hour"  id="hour"><div class="label">' + plugin._options['hourtext'] + '</div><div class="mlc-ul" id="hour-ul"><div class="mlc-ul-i">';
                    for (var i = 0; i <= 23; i++) {
                        selbd += '<div role="option" class="mlc-li" ml-selected="false" data-val="' + (i < 10 ? '0' + i : i) + '"><div class="mlc-i">' + (i < 10 ? '0' + i : i) + '</div></div>';
                    }
                    selbd += '</div></div></div>';
                    $('.mlc').append(selbd);
                    if (plugin._options['loopitem'].indexOf('hour') != -1) {
                        $("#hour-ul").append($('#hour-ul').html());
                    }
                    ;
                }
                if (data.dateWheels.indexOf('ss') != -1) {
                    var selbd = ' <div class="mlc-item mlc-item-hour"  id="second"><div class="label">' + plugin._options['secondtext'] + '</div><div class="mlc-ul" id="second-ul"><div class="mlc-ul-i">';
                    for (var i = 0; i <= 59; i++) {
                        selbd += '<div role="option" class="mlc-li" ml-selected="false" data-val="' + (i < 10 ? '0' + i : i) + '"><div class="mlc-i">' + (i < 10 ? '0' + i : i) + '</div></div>';
                    }
                    selbd += '</div></div></div>';
                    $('.mlc').append(selbd);
                    if (plugin._options['loopitem'].indexOf('second') != -1) {
                        $("#second-ul").append($('#second-ul').html());
                    }
                }
            },
            //判断平年，闰年
            isLeap: function (y) {
                return y % 4 === 0 ? (y % 100 !== 0 ? 1 : (y % 400 === 0 ? 1 : 0)) : 0;
            },
            //根据yyyy-mm-dd格式返回date类型数据
            getDateType: function (date) {
                if (date == "now") {
                    var date = new Date();
                    return date;
                } else {
                    var dateArr = date.split('-');
                    var date = new Date(dateArr[0], parseInt(dateArr[1]) - 1, dateArr[2]);
                    return date;
                }

            },
            //滚动过程最大最小值比较
            isMaxMin: function (cy, cm, cd) {
                var data = plugin._options['seldata'];
                if ($.trim(data.minDate).length) {
                    if ($("#year").length && $("#month").length || $("#date").length) {
                        if (new Date(cy, parseInt(cm) - 1, cd) <= plugin._datetime.getDateType(data.minDate)) {
                            return '01'; //低于最小值
                        }
                    }
                }
                if ($.trim(data.maxDate).length) {
                    if ($("#year").length && $("#month").length || $("#date").length) {
                        if (new Date(cy, parseInt(cm) - 1, cd) >= plugin._datetime.getDateType(data.maxDate)) {
                            return '02'; //超过最大值
                        }
                    }
                }
                return false;
            }
        };
        //插件渲染
        plugin._render = {
            //创建选择框的html对象
            createDom: function () {
                $('.ml-select').remove();
                if ($('.ml-select').length == 0) {
                    var mlcStr = $('<div class="ml-select" id="ml"><div class="ml-persd">' +
                            '<div class="ml" role="dialog" id="ml-box"><div class="mlh">' +
                            '<div class="mlh-c"><a btntype="mlh-cancel" class="ml-btn" href="javascript:void(0)">' + plugin._options['cancelbtntext'] + '</a>' +
                            '<div class="mlh-label">' + plugin._options['selholder'] + '</div><a btntype="mlh-sure" class="ml-btn" href="javascript:void(0)">' + plugin._options['surebtntext'] + '</a></div> </div>' +
                            '<div class="mlc" id="mlc"><div class="mlc-so"></div>' +
                            '</div></div></div></div>');
                    $('body').append(mlcStr);
                    //加载数据
                    if (plugin._options['type'] == "select") {
                        var selData = plugin._options['seldata'];
                        for (var i = 0; i < selData.length; i++) {
                            var dataobj = $.parseJSON(selData[i]);
                            var selbd = ' <div class="mlc-item mlc-item-select"  id="' + dataobj.id + '"><div class="mlc-ul" id="' + dataobj.id + '-ul"><div class="mlc-ul-i">';
                            for (var j = 0; j < dataobj.data.length; j++) {
                                selbd += '<div role="option" class="mlc-li" ml-selected="false" data-val="' + dataobj.data[j].value + '"><div class="mlc-i">' + dataobj.data[j].opt + '</div></div>';
                            }
                            selbd += '</div></div></div>';
                            $('.mlc').append(selbd);
                        }
                    }
                    if (plugin._options['type'] == "datetime") {
                        plugin._datetime.createDateDom();
                    }
                    plugin._render.initStyle();
                }
            },
            initStyle: function () {
                var step = plugin._options['step'];
                $(".ml-select .mlc-li").css({
                    'heigth': step + 'px',
                    'line-height': step + 'px'
                });
                $(" .ml-select .mlc-so").css({
                    'height': step + 'px',
                    'top': 2 * step + 'px'
                });
                $(".ml-select .mlc-item .label").css({
                    'top': 2 * step + 'px',
                    'heigth': step + 'px',
                    'line-height': step + 'px'
                });
                $(".ml-select").css({
                    'z-index': plugin._options['zIndex']
                });
                //滚动宽度处理
                if ($("#hour").length && $("#second").length && !$("#month").length && !$("#date").length) {
                    $("#hour").css({"padding-left": "30%"});
                    $("#second").css({"padding-right": "30%"});
                    $("#second .label").css({'right': 'auto', "left": "26px"})
                }
                if (!$("#hour").length && !$("#second").length && $("#year").length && $("#month").length && $("#date").length) {
                    $(".mlc-item").eq(0).css({"padding-left": "30px"});
                    $(".mlc-item").eq(1).css({"padding": "0px 20px"});
                    $(".mlc-item").eq(2).css({"padding": "0px 50px 0px 20px"});
                    $(".mlc-item").eq(2).find(".label").css({"right": "auto", "left": "46px"});
                }
            },
            /**
             * 绑定事件
             */
            bindevent: function () {
                $("#" + plugin._options['id']).off('click').on('click', function () {
                    plugin._render.run();
                    plugin._render.touchScroll();
                    plugin._render.mouseScroll();
                    if (!$.trim($("#" + plugin._options['id']).attr('data-val')).length) {
                        plugin._render.initOpt(plugin._options['defaultVal']);
                    } else {
                        plugin._render.initOpt($.trim($("#" + plugin._options['id']).attr('data-val')));
                    }
                    plugin._event.show();
                    //循环初始化
                    if (plugin._options['loopitem'].length) {
                        $.each(plugin._options['loopitem'], function (i) {
                            plugin._event.loopChange(plugin._options['loopitem'][i]);
                        });
                    }

                });
                //选择框关闭响应
                $('.ml-select').off('click').on('click', function (e) {
                    var e = e || window.event; //浏览器兼容性
                    var elem = e.target || e.srcElement;
                    while (elem) { //循环判断至跟节点，防止点击的是div子元素
                        if (elem.id && elem.id == 'ml-box') {
                            return;
                        }
                        elem = elem.parentNode;
                    }
                    plugin._event.close();
                });
                //取消、确定事件
                $('.mlh .ml-btn').off('click').on('click', function () {
                    var bmtype = $(this).attr('btntype');
                    switch (bmtype) {
                        case 'mlh-sure':
                            //获取已选值
                            var selectedKey = [], selectedVal = [];
                            $(".mlc-li").each(function () {
                                if ($(this).attr('ml-selected') == "true") {
                                    selectedKey.push($(this).attr('data-val'));
                                    selectedVal.push($(this).find('.mlc-i').html());
                                }
                            });
                            if (plugin._options['type'] == "select") {
                                $("#" + plugin._options['id']).html(selectedVal.join(','));
                                $("#" + plugin._options['id']).attr("data-val", selectedKey.join(','));
                            }
                            if (plugin._options['type'] == "datetime") {
                                //判断显示格式
                                //plugin._options['format']
                                var y = '', m = '', d = '', D = '', h = '', s = '', datewheels = [];
                                if ($("#year").length) {
                                    y = $("#year").attr('data-val');
                                    datewheels.push(y);
                                }
                                if ($("#month").length) {
                                    var md = $("#month").attr('data-val');
                                    if (md.split('-').length == 3) {
                                        md = md.split('-')[1] + '-' + md.split('-')[2];
                                    }
                                    if ($("#date").length) {
                                        md += '-' + $("#date").attr('data-val');
                                    }
                                    datewheels.push(md);
                                    m = md.substr(0, 2);
                                    d = md.substr(3, 2);
                                    if (plugin._options['seldata'].dateWheels.indexOf('DD') != -1) {
                                        D = plugin._datetime.getWeek(y, parseInt(m) - 1, d);
                                    }
                                } else {
                                    datewheels.push('');
                                }
                                if ($("#hour").length) {
                                    h = $("#hour").attr('data-val');
                                    datewheels.push(h);
                                } else {
                                    datewheels.push('');
                                }
                                if ($("#second").length) {
                                    s = $("#second").attr('data-val');
                                    datewheels.push(s);
                                } else {
                                    datewheels.push('');
                                }
                                if ($("#year").length == 0) {
                                    if ($("#month").length != 0) {
                                        y = $("#month").attr('data-val').split('-')[0];
                                    } else {
                                        y = '';
                                    }

                                    datewheels.splice(0, 0, y);
                                }
                                var dateStr = plugin._options['seldata'].format.replace('yyyy', y).replace('mm', m).replace('dd', d).replace('DD', D).replace('hh', h).replace('ss', s);
                                $("#" + plugin._options['id']).html(dateStr);
                                $("#" + plugin._options['id']).attr("data-val", datewheels.join(','));
                            }
                            if (typeof plugin._options['onSure'] === 'function') {
                                plugin._options['onSure']();
                            }
                            plugin._event.close();
                            break;
                        case 'mlh-cancel':
                            plugin._event.close();
                            if (typeof plugin._options['onCancel'] === 'function') {
                                plugin._options['onCancel']();
                            }
                            break;
                    }
                });
            },
            //手势滚动事件
            touchScroll: function () {
                var step = plugin._options['step'];
                var id = '';
                //判断滑动手势
                var obj = document.getElementById('mlc');
                //滑动处理
                var startX, startY, i = 0, j = 0, h = 0;
                //比较大小参数
                var cy = "", cm = "", cd = "";
                obj.addEventListener('touchstart', function (ev) {
                    $(".mlc-item").css('overflow', 'scroll');
                    if ($("#year").length && $("#month").length || $("#date").length) {
                        cy = $("#year").attr('data-val');
                        cm = $("#month").attr('data-val');
                        if ($("#date").length) {
                            cd = $("#date").attr('data-val');
                        }
                    }
                    id = plugin._event.getHandler(ev);
                    h = plugin._event.getTranslate(id);
                    startX = ev.touches[0].pageX;
                    startY = ev.touches[0].pageY;
                }, false);
                obj.addEventListener('touchmove', function (ev) {
                    ev.preventDefault();
                    var moveX = ev.touches[0].pageX;
                    var moveY = ev.touches[0].pageY;
                    var y = moveY - startY + h;
                    $("#" + id).find('.mlc-ul').css({'-webkit-transform': 'translate(0px,' + y + 'px)'});
                    $("#" + id).find('.mlc-li').attr('ml-selected', 'false');
                    if (y > step * 2) {
                        $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(y / step) - 2)).attr('ml-selected', 'false');
                    } else {
                        $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(y / step) - 2)).attr('ml-selected', 'true');
                        if (id == "year") {
                            if (-y >= $("#year-ul").height() - 3 * step) {
                                cy = $("#" + id).find('.mlc-li').eq(Math.abs(Math.round($("#year-ul").height() / step) - 1)).attr('data-val');
                            } else {
                                cy = $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(y / step) - 2)).attr('data-val');
                            }
                        }
                        ;
                        if (id == "month") {
                            cm = $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(y / step) - 2)).attr('data-val')
                        }
                        ;
                        if (id == "date") {
                            cd = $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(y / step) - 2)).attr('data-val')
                        }
                    }
                }, false);
                obj.addEventListener('touchend', function (ev) {
                    //判断是否为最大最小值
                    if (plugin._datetime.isMaxMin(cy, cm, cd) == "01" || plugin._datetime.isMaxMin(cy, cm, cd) == "02") {
                        if (plugin._datetime.isMaxMin(cy, cm, cd) == "01") {
                            var data = plugin._options['seldata'];
                            var min_date = plugin._datetime.getDateType(data.minDate);
                            var y = min_date.getFullYear(), m = min_date.getMonth() + 1, d = min_date.getDate(), h = new Date().getHours(), s = new Date().getMinutes();
                            plugin._render.initOpt(y + ',' + m + '-' + d + ',' + h + ',' + s);
                        }
                        if (plugin._datetime.isMaxMin(cy, cm, cd) == "02") {
                            var data = plugin._options['seldata'];
                            var max_date = plugin._datetime.getDateType(data.maxDate);
                            var y = max_date.getFullYear(), m = max_date.getMonth() + 1, d = max_date.getDate(), h = new Date().getHours(), s = new Date().getMinutes();
                            plugin._render.initOpt(y + ',' + m + '-' + d + ',' + h + ',' + s);
                        }
                    } else {
                        var h = $('#' + id + '-ul').height();
                        var y = Math.round(plugin._event.getTranslate(id) / step) * step;
                        y = y > step * 2 ? step * 2 : y < -(h - step * 3) ? -(h - step * 3) : y;
                        $("#" + id).find('.mlc-ul').css({'-webkit-transform': 'translate(0px,' + y + 'px)'});
                        $("#" + id).find('.mlc-li').attr('ml-selected', 'false');
                        $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(y / step) - 2)).attr('ml-selected', 'true');
                        $("#" + id).attr('data-val', $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(y / step) - 2)).attr('data-val'));
                    }
                    $("#" + id).off("touchstart");
                    $("#" + id).off("touchmove");
                    plugin._datetime.refreshMd();
                    plugin._datetime.refreshDays();
                    //循环初始化
                    if (plugin._options['loopitem'].length) {
                        $.each(plugin._options['loopitem'], function (i) {
                            plugin._event.loopChange(plugin._options['loopitem'][i]);
                        });
                    }
                }, false);
            },
            //初始化选择值 传入val
            initOpt: function (val) {
                var isExist = 0, valArr = [];
                if (plugin._options['type'] == "datetime") {
                    if (!$.trim(val).length || typeof val == "undefined") {
                        val = new Date();
                    } else {
                        val = val.split(',');
                        if (val[0] != '' && val[1] != '') {
                            var m = parseInt(val[1].split('-')[0]) - 1;
                            var d = val[1].split('-')[1];
                            val = new Date(val[0], m, d, val[2], val[3]);
                        } else {
                            val = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), val[2], val[3]);
                        }

                    }
                    var md_val = '';
                    var i = val.getMonth() + 1;
                    var j = val.getDate();
                    valArr.push(val.getFullYear());
                    plugin._options['seldata'].dateWheels.indexOf('mm') != -1 ? plugin._options['seldata'].dateWheels.indexOf('dd') != -1 ? (md_val += (i < 10 ? '0' + i : i) + '-' + (j < 10 ? '0' + j : j)) : (md_val += (j < 10 ? '0' + j : j)) : (md_val += (i < 10 ? '0' + i : i));
                    valArr.push(md_val);
                    valArr.push(val.getHours() < 10 ? '0' + val.getHours() : val.getHours());
                    valArr.push(val.getMinutes() < 10 ? '0' + val.getMinutes() : val.getMinutes());
                    //初始化值
                    $("#year").attr('data-val', valArr[0]);
                    if ($("#month").length && $("#date").length) {
                        $("#month").attr('data-val', valArr[1].split('-')[0]);
                        $("#date").attr('data-val', valArr[1].split('-')[1]);
                    } else {
                        //无年份选择日期
                        if (!$("#year").length && $("#month").length && !$("#date").length) {
                            $("#month").attr('data-val', valArr[0] + '-' + valArr[1]);
                        } else {
                            $("#month").attr('data-val', valArr[1]);
                        }
                    }

                    $("#hour").attr('data-val', valArr[2]);
                    $("#second").attr('data-val', valArr[3]);
                }

                plugin._datetime.refreshMd();
                plugin._datetime.refreshDays();
                if (plugin._options['type'] == "select") {
                    $("#" + $.parseJSON(plugin._options['seldata']).id).attr("data-val", val);
                    valArr.push(val);
                }
                $(".mlc-item").each(function (index) {
                    $this = $(this);
                    $this.find('.mlc-ul').css({'-webkit-transform': 'translate(0px,0px)'});
                    $this.find('.mlc-li').attr('ml-selected', 'false');
                    $this.find('.mlc-li').each(function (i) {
                        if ($(this).attr('data-val') == $this.attr('data-val')) {
                            isExist = 1;
                            $(this).attr('ml-selected', 'true');
                            $this.find('.mlc-ul').css({'-webkit-transform': 'translate(0px,' + -plugin._options['step'] * (i - 2) + 'px)'});
                            return false;
                        }
                    });
                    if (isExist == 0) {
                        $this.find('.mlc-li').attr('ml-selected', 'false');
                        $this.find('.mlc-li').eq(0).attr('ml-selected', 'true');
                        $this.find('.mlc-ul').css({'-webkit-transform': 'translate(0px,' + plugin._options['step'] * 2 + 'px)'});
                    }
                });
            },
            //鼠标滚动事件
            mouseScroll: function () {
                var scrollFunc = function (e) {
                    $(".mlc-item").css('overflow', 'hidden');
                    var id = plugin._event.getHandler(e);
                    var moveY = 0;
                    var h = $('#' + id + '-ul').height();
                    e = e || window.event;
                    var step = Math.abs(e.wheelDelta / 120) < 2 ? 2 : Math.abs(e.wheelDelta / 120);
                    if (e.wheelDelta > 0 || e.detail > 0) {//IE/Opera/Chrome 正负120 Firefox 正负3
                        var y = plugin._event.getTranslate(id) + plugin._options['step'] / 2 * step;
                        y = y > plugin._options['step'] ? plugin._options['step'] * 2 : y;
                        $("#" + id).find('.mlc-ul').css({'-webkit-transform': 'translate(0px,' + y + 'px)'});
                        moveY = y;
                    } else {
                        var y = plugin._event.getTranslate(id) - plugin._options['step'] / 2 * step;
                        y = y < -(h - plugin._options['step'] * 3) ? -(h - plugin._options['step'] * 3) : y;
                        $("#" + id).find('.mlc-ul').css({'-webkit-transform': 'translate(0px,' + y + 'px)'});
                        moveY = y;
                    }
                    $("#" + id).find('.mlc-li').attr('ml-selected', 'false');
                    $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(moveY / plugin._options['step']) - 2)).attr('ml-selected', 'true');
                    $("#" + id).attr('data-val', $("#" + id).find('.mlc-li').eq(Math.abs(Math.round(moveY / plugin._options['step']) - 2)).attr('data-val'));
                    plugin._datetime.refreshMd();
                    plugin._datetime.refreshDays();
                    //循环初始化
                    if (plugin._options['loopitem'].length) {
                        $.each(plugin._options['loopitem'], function (i) {
                            plugin._event.loopChange(plugin._options['loopitem'][i]);

                        });
                    }
                };
                //兼容性处理
                if (document.getElementById('mlc').addEventListener) {
                    document.getElementById('mlc').addEventListener('DOMMouseScroll', scrollFunc, false);
                }//Firefox
                document.getElementById('mlc').onmousewheel = document.getElementById('mlc').onmousewheel = scrollFunc; //IE/Opera/Chrome/Safari

            },
            init: function () {
                plugin._render.createDom();
                //初始化参数
                plugin._thisattr.init();
                plugin._render.bindevent();
            },
            run: function () {
                this.init();
            }
        }
        ;
    };
    //插件暴露的方法
    _bmselect.prototype = {
        run: function () {
            this._render.run();
        }
    };
    var bmselect = function (option) {
        var bmselect = new _bmselect(option);
        bmselect.run();
    };
    //将插件添加进jQuery中
    $.bmselect = bmselect;
})(jQuery, window, document);
