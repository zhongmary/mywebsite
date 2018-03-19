$(function() {
    //加载当前月份的周末和节假日
    var myDate = new Date();
    var year = myDate.getFullYear();
    var month = myDate.getMonth() + 1;
    var day = myDate.getDate();
   // getHolidays(year + "-" + month + "-" + day);

    createCalendar($("#calendar"), nextMonthReady, lastMonthReady);
    //根据当前触摸点的日期进行上午、下午、全天的切换
    $(".time_interval").off('click').on('click', 'a', function() {
        var tdID = $("#currentTouch").attr('data-val');
        $("#" + tdID).find('font').removeClass().addClass($(this).attr('class')).addClass('selected');
        //刷新数据
        refreshData($("#calendar"));
    });
    //清空
    $("#tcancel").off('click').on('click', function() {
        $(".calendarTb").find(".selected").removeClass('all_selected').removeClass('mor_selected').removeClass('aft_selected').removeClass('selected');
        $("#all-selected-data").html('');
    });
    //确定
    $("#tsure").off('click').on('click', function() {
        var startime = $(".start_time_c").html();
        var endime = $(".start_time_c").html();
        var daynums = $(".total_time_c").html();
       var selectedData = getSelectedData();
        //对选择数据处理（按是否连续拼接）00xxxx00 00xxxx01 02xxxx00 02xxxx01
        var result=[];//存放处理完成的数据
        var sData=[];
        $.each(selectedData,function(i,obj){
            var _sdata={};
            _sdata.ym=obj.id;
            _sdata.val=JSON.parse(obj.value);
            sData.push(_sdata);
        });
        console.log(sData);
        var tperiod={};//时间
       //sData为跨月选择的所有数据
        for(var i=0;i<sData.length;i++){
            //1.1最后一个月id
            var ldid=lastDayID(sData[i].ym);
            var sobj=(sData[i].val)[sData[i].ym];//存放每个月的选择数据对象数组
            console.log(sobj+'00');

            //1.2获取id值
            for(var j=0;j<sobj.length;j++){
                   if((j+1)<sobj.length){
                    if(parseInt(sobj[j].id)+1==parseInt(sobj[j+1].id)){//id连续的情况
                     if(sobj[j].flag=="01"){
                         tperiod.startTime=sobj[j].date;
                         tperiod.endTime=sobj[j].date;
                         tperiod.startType='上午';
                         tperiod.endType='上午';
                         result.push(tperiod);
                         tperiod={};
                         continue;
                     }else {
                         if (sobj[j].flag == "00") {//00开头
                             tperiod.startTime = sobj[j].date;
                             tperiod.startType = '全天';

                                 while (sobj[j + 1].flag == "00") {
                                     j++;
                                     if((j+1)>=sobj.length){
                                         break;
                                     }
                                 }


                             if (sobj[j].flag == "01") {
                                 tperiod.endTime = sobj[j+1].date;
                                 tperiod.endType = '上午';
                                 result.push(tperiod);
                                 tperiod = {};
                                 continue;
                             } else {
                                 tperiod.endTime = sobj[j].date;
                                 tperiod.endType = '全天';
                                 result.push(tperiod);
                                 tperiod = {};
                                 continue;
                             }
                         } else {//02开头
                             tperiod.startTime = sobj[j].date;
                             tperiod.startType = '全天';
                             while (sobj[j + 1].flag == "00") {
                                 j++;
                                 if((j+1)>=sobj.length){
                                     break;
                             }}
                             if (sobj[j].flag == "01") {
                                 tperiod.endTime = sobj[j + 1].date;
                                 tperiod.endType = '上午';
                                 result.push(tperiod);
                                 tperiod = {};
                                 continue;
                             } else {
                                 tperiod.endTime = sobj[j].date;
                                 tperiod.endType = '全天';
                                 result.push(tperiod);
                                 tperiod = {};
                                 continue;
                             }
                         }

                     }
                             }
                         }else{//id不连续的情况
                        //判断是否是最后一天
                        //临近月
                        if((i+1)<sData.length){
                            var nexty=(sData[i+1].val)[sData[i+1].ym].split(0,4);
                            var nextm=(sData[i+1].val)[sData[i+1].ym].split(4,6);
                            var presenty=(sData[i].val)[sData[i].ym].split(0,4);
                            var presentm=(sData[i].val)[sData[i].ym].split(4,6);
                            var lx=new Date(nextm,nexty,1)==new Date(presenty,parseInt(presentm)+1,1)?1:0;
                            var nextMID=(sData[i+1].val)[sData[i+1].ym][0].id;//临近月的所选择数据的首个id
                            var nextfdID=new Date(nexty,nextm,1).getDay();////临近月的首日id
                            if(parseInt(sobj[j].id)==ldid&&lx&&nextfdID==nextfdID){//是最后一天且跟下月连续的情况
                                if(sobj[j].flag=="00"){
                                    tperiod.startTime=sobj[j].date;
                                    tperiod.startType='全天';
                                }else if(sobj[j].flag=="02"){
                                    tperiod.startTime=sobj[j].date;
                                    tperiod.startType='下午';
                                }
                                //判断下个月的首日是否为00或者01
                                if((sData[i+1].val)[sData[i+1].ym][0].flag=="00"||(sData[i+1].val)[sData[i+1].ym][0].flag=="02"){
                                    break;
                                }

                            }else{//是最后一天但不跟下月连续
                                tperiod.startTime=sobj[j].date;
                                tperiod.endTime=sobj[j].date;
                                if(sobj[j].flag=="00"){
                                    tperiod.startType='全天';
                                    tperiod.endType='全天';
                                }else if(sobj[j].flag=="01"){
                                    tperiod.startType='上午';
                                    tperiod.endType='上午';
                                }else if(sobj[j].flag=="02"){
                                    tperiod.startType='下午';
                                    tperiod.endType='下午';
                                }

                                result.push(tperiod);
                                tperiod={};
                                continue;

                            }

                        }else{//无连续月
                            tperiod.startTime=sobj[j].date;
                            tperiod.endTime=sobj[j].date;
                            if(sobj[j].flag=="00"){
                                tperiod.startType='全天';
                                tperiod.endType='全天';
                            }else if(sobj[j].flag=="01"){
                                tperiod.startType='上午';
                                tperiod.endType='上午';
                            }else if(sobj[j].flag=="02"){
                                tperiod.startType='下午';
                                tperiod.endType='下午';
                            }

                            result.push(tperiod);
                            tperiod={};
                            continue;
                       }



                    }


                    }
                }
        console.log(result+'ee');


    });
    bindTouch();
});


var goBackPage = function() {
    var url = $("#domain").val() + "attence/vacapply.php";//var url = "http://10.100.2.235/mhr/attence/vacapply.php";
    var datavacapply = '';
    var holidaytype = $("#holidaytype").val();
    if (holidaytype == "") {
        pop.ini(['请选择假期类型', 1], [['确定']]);
        return;
    }
    var params = {"startTime": datavacapply, "endTime": holidaytype};
    formpost(url, params);
};

var formpost = function(url, params) {
    var temp = document.createElement("form");
    temp.action = url;
    temp.method = "post";
    temp.style.display = "none";
    for (var x in params) {

        var opt = document.createElement("textarea");
        opt.name = x;
        opt.value = params[x];
        temp.appendChild(opt);
    }
    document.body.appendChild(temp);
    temp.submit();
};

function getHolidays(date) {
    var trandata = $.parseJSON($(".trandata").val());
    var holidaytype = trandata.holidaytype;
    var url = domain + "ajax/attence/vactime.ajax.php";
    var param = {'date': date, "optype": "getholidays", "holidaytype": holidaytype};
    var result = ajaxRequest(url, param, 'get', 'json');
    return result;
}

//日期滑动选择事件
function bindTouch() {
    //单指拖动
    var obj = document.getElementById('calendar');
    var stratID = "", endID = "", stratX, startY, endX, endY;
    obj.addEventListener("touchstart", function(event) {
        //初始化
        stratID = "", endID = "";
        // 如果这个元素的位置内只有一个手指的话  
        if (event.targetTouches.length === 1) {
            var touch = event.targetTouches[0];
            var touchObj = touch.target.tagName.toLowerCase();
            if (touchObj === 'td' || touchObj === 'font') {
                if (touchObj === 'font') {
                    stratID = touch.target.parentNode.id;
                } else {
                    stratID = touch.target.id;
                }
                stratX = touch.clientX;
                startY = touch.clientY;
            }

        }
        obj.addEventListener('touchmove', function(event) {
            if (event.targetTouches.length === 1) {
                event.preventDefault(); // 阻止浏览器默认事件
            }
        }, false);

    });
    obj.addEventListener("touchend", function(event) {
        var touch = event.changedTouches[0];

        endX = touch.clientX;
        endY = touch.clientY;
        $("#calendar").off("touchstart");
        $("#calendar").off("touchmove");
        //obj.removeEventListener("touchstart");
        // obj.removeEventListener("touchmove");
        //获取页面td宽度
        var tdWidth = $(this).find('td').width();
        var tdHeight = $(this).find('td').height();
        //计算横向移动和纵向移动td个数
        var moveX = parseFloat(endX) - parseFloat(stratX);
        var moveY = parseFloat(endY) - parseFloat(startY);
        var td_x_nums, td_y_nums;
        if (Math.abs(moveX % tdWidth) < tdWidth / 2) {
            if (moveX < 0) {
                td_x_nums = Math.ceil(moveX / tdWidth);
            } else {
                td_x_nums = Math.floor(moveX / tdWidth);
            }
        } else {
            if (moveX < 0) {
                td_x_nums = Math.ceil(moveX / tdWidth) - 1;
            } else {
                td_x_nums = Math.floor(moveX / tdWidth) + 1;
            }
        }
        if (Math.abs(moveY % tdHeight) < tdHeight / 2) {
            if (moveY < 0) {
                td_y_nums = Math.ceil(moveY / tdHeight);
            } else {
                td_y_nums = Math.floor(moveY / tdHeight);
            }
        } else {
            if (moveY < 0) {
                td_y_nums = Math.ceil(moveY / tdHeight) - 1;
            } else {
                td_y_nums = Math.floor(moveY / tdHeight) + 1;
            }
        }

        //计算滑动结束时的最后一个td的ID值
        if (stratID !== "") {
            var srows = Math.floor(stratID / 7);//滑动td所在行数 0-5
            if (td_y_nums < 0) {
                if (Math.abs(td_y_nums) > srows) { //向上滑出日历
                    endID = 0;
                } else {
                    endID = parseInt(stratID) + 7 * parseInt(td_y_nums) + parseInt(td_x_nums);
                }
            } else {
                if (Math.abs(td_y_nums) + srows > 5) {//向下滑出日历
                    endID = 41;
                } else {
                    endID = parseInt(stratID) + 7 * parseInt(td_y_nums) + parseInt(td_x_nums);
                }
            }
        }
        //对选中id内td处理
        if (stratID > endID) {
            var temp = stratID;
            stratID = endID;
            endID = temp;
        }
        for (var i = stratID; i < parseInt(endID) + 1; i++) {
            if (!$("#" + i).find('font').hasClass('cal_othermonth') && !$("#" + i).find('font').hasClass('cal_holiday')) {
                $("#" + i).find('font').hasClass("selected") ? $("#" + i).find('font').removeClass() : $("#" + i).find('font').addClass("all_selected").addClass('selected');
            }
        }
        if ($("#" + endID).find('font').hasClass("selected")) {
            //根据最后一个ID是否被选中，判断是否显示上下午及全天切换按钮
            $("#currentTouch").html($("#" + endID).find('font').html());
            $("#currentTouch").attr("data-val", endID);
            $(".time_interval>div").css('display', 'block');
        } else {
            $("#currentTouch").html('');
            $(".time_interval>div").css('display', 'none');
        }
        //刷新数据
        refreshData($("#calendar"));


    });
}

//获取已选数据
function refreshData(obj) {
    var selectedArr = new Array();
    var currentMonth=$(".vactime .cal_currmonth").html().replace('年','').replace('月','');//记录当前月
    var holidayTime=0;//记录时长
    for (var i = 0; i < obj.find('font').length; i++) {
        var selectedObj = {};
        var _this = obj.find('font').eq(i);
        if (_this.hasClass('selected')) {
            //日期
            selectedObj.date = _this.parent().attr('data');
            selectedObj.id = _this.parent().attr('id');
            //01为上午 02为下午 00为全天
            if (_this.hasClass('mor_selected')) {
                selectedObj.flag = "01";
                holidayTime = holidayTime + 0.5;
            }
            if (_this.hasClass('aft_selected')) {
                selectedObj.flag = "02";
                holidayTime = holidayTime + 0.5;
            }
            if (_this.hasClass('all_selected')) {
                selectedObj.flag = "00";
                holidayTime++;
            }
            selectedArr.push(selectedObj);
        }
    }

    //刷新数据
    var newData = selectedArr;
    if (newData.length !== 0) {
        $(".time_detail .unselected").css('display', 'none');
        $(".time_detail .selected_result").css('display', 'block');
        //显示处理
        $(".selected_result .start_time_c").html(newData[0].date);
        $(".selected_result .end_time_c").html(newData[newData.length - 1].date);

        //选取值放置隐藏域中 newData转化为json字符串
        var newDataJSON = '[';
        $.each(newData, function(i, obj) {
            if (i !== newData.length - 1) {
                newDataJSON += '{"date":"' + obj.date + '","flag":"' + obj.flag + '","id":"' + obj.id + '"},';
            } else {
                newDataJSON += '{"date":"' + obj.date + '","flag":"' + obj.flag + '","id":"' + obj.id + '"}';
            }

        });
        newDataJSON += ']';

        if(!$("#"+currentMonth).length){
        $(".vactime #all-selected-data").append('<input style="display: none"  id="' +currentMonth + '">');
        }
        $("#"+currentMonth).attr("value",'{"'+currentMonth+'":'+ newDataJSON+'}');
        $("#"+currentMonth).attr("nums",holidayTime);
    } else {
        $("#"+currentMonth).attr("value", "");
        $("#"+currentMonth).attr("nums",0);
    }
    //显示时长
    var time=0;
    var seletctedData=getSelectedData();
    if(seletctedData.length!=0){
        $.each(seletctedData,function(i,obj){
            time=time+parseFloat(obj.nums);
        });
    }
    $(".selected_result .total_time_c").html(time);

    if($(".selected_result .total_time_c").html()=="0"|| $.trim($(".selected_result .total_time_c").html()).length==0){
        $(".time_detail .unselected").css('display', 'block');
        $(".time_detail .selected_result").css('display', 'none');
    }

}

//点击上月预加载事件
var lastMonthReady = function() {
    addHoliday(false);
};
//点击下月预加载事件
var nextMonthReady = function() {
    addHoliday(true);
};
//为日历添加休息日
function addHoliday(index) {
    //获取上月或下月年月yyyy-mm-dd
    var date = $(".cal_currmonth").html();
    var y = date.substring(0, 4);
    var oldm = parseInt(date.substring(5, 7));
    if (index) {
        var m = parseInt(date.substring(5, 7)) + 1;
    } else {
        var m = parseInt(date.substring(5, 7)) - 1;
    }
    var oldm = oldm < 10 ? '0' + oldm : oldm;
    m = m < 10 ? '0' + m : m;
    //加载当前月份的周末和节假日
    //var holidayData = getHolidays(y + "-" + m + "-" + '01');
    //if (holidayData.data) {
    //    if (holidayData.data.length !== 0) {
    //        //假期日数组
    //        var holidayArr = new Array();
    //        //假期日ID数组
    //        var holidayIDArr = new Array();
    //        $.each(holidayData.data, function(i, obj) {
    //            holidayArr.push(parseInt(obj.holiday.split("-")[2]));
    //            holidayIDArr.push(parseInt(obj.holiday.split("-")[2]) - 1 + new Date(y, m - 1, 1).getDay());
    //        });
    //        $.each(holidayIDArr, function(i, obj) {
    //            $("#" + obj).find('font').addClass('cal_holiday');
    //        });
    //    }
    //}



    //初始化已选值
    if ($("#" + y + "" + m).length && $("#" + y + "" + m).attr("value").length !== 0) {
      initSelected($.parseJSON($("#" + y + "" + m).attr("value")),y+""+m);
    }
}
//加载已选值
function initSelected(data,key) {
    $.each(data[key], function(i, obj) {
        switch (obj.flag) {
            case "00":
                $("#" + obj.id).find('font').addClass('selected').addClass('all_selected');
                break;
            case "01":
                $("#" + obj.id).find('font').addClass('selected').addClass('mor_selected');
                break;
            case "02":
                $("#" + obj.id).find('font').addClass('selected').addClass('aft_selected');
                break;
        }
    });
}
//获取所有已选值
function getSelectedData(){
    var selectedObj=[];
    if($("#all-selected-data input").length){
        $("#all-selected-data input").each(function(i,obj){
            var selectedData={};
            selectedData.nums=$(obj).attr('nums');
            selectedData.value= $(obj).attr('value');
            selectedData.id=$(obj).attr('id');
            selectedObj.push(selectedData);
        });
    }
    return selectedObj;
}
//根据yyyymm格式判断最后一个月ID值
function lastDayID(date){
    //当月第一天所属星期
    var y=date.substring(0,4);
    var m=parseInt(date.substring(4,6))-1;
    var fd=new Date(y,m,1).getDay();
    var per_month_days = new Array(31, 28 + isLeap(y), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
    var last_day_id=per_month_days[m]+fd-1;
    console.log(last_day_id+'dd');
    return last_day_id;
}
//判断平年，闰年
function isLeap(y) {
    return y % 4 === 0 ? (y % 100 !== 0 ? 1 : (y % 400 === 0 ? 1 : 0)) : 0;
}
//日历
function createCalendar(obj, nextload, lastload) {
    var calendar = {
        obj: obj,
        //日期转化为字符串，格式为yyyy-mm-dd
        getDateStr: function(date) {
            var _year = date.getFullYear();
            var _month = date.getMonth() + 1;    // 月从0开始计数
            var _d = date.getDate();
            _month = (_month > 9) ? ("" + _month) : ("0" + _month);
            _d = (_d > 9) ? ("" + _d) : ("0" + _d);
            return _year + '-' + _month + '-' + _d;
        },
        //渲染日历抬头
        renderCalTitle: function() {
            var curren_y_m_d = calendar.getDateStr(new Date()).split('-');
            var caltitleStr = '<div class="cal_title"><table> <tr><td><a href="javascript:void(0);" class="cal_premonth"><img src="img/att_turnleft.png" /></a></td>'
                    + '<td class="cal_currmonth">' + curren_y_m_d[0] + '年' + curren_y_m_d[1] + '月' + '</td><td><a href="javascript:void(0);" class="cal_nextmonth"><img src="img/att_turnright.png" /></a></td></tr></table></div>';
            calendar.obj.append(caltitleStr);
        },
        //渲染日期表格
        renderCalendar: function(dateobj) {
            //初始化
            $(".calendarTb").remove();
            //定义当前日期 y:年 m:月 d:日 fd:当月第一天 fw:当月第一天所属星期 per_month_days:每月天数
            y = dateobj.getFullYear(), m = dateobj.getMonth(), d = dateobj.getDate(), fd = new Date(y, m, 1), fw = fd.getDay(), per_month_days = new Array(31, 28 + calendar.isLeap(y), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);
            //确定表格所需要的行
            var tr_nums = Math.ceil((fw + per_month_days[m]) / 7);
            //定义类名
            var className = "";
            //创建表格
            var calendarTb = '<table class="calendarTb"><tr class="cal_weekhead"><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr>';
            for (var i = 0; i < tr_nums; i++) {
                calendarTb += '<tr>';
                for (var k = 0; k < 7; k++) {
                    //为每个表格添加索引
                    var index = 7 * i + k;
                    //根据当月第一天所属星期重置索引，使得当月首日的索引为1
                    var date_index = index - fw + 1;
                    //date_index<=0为上月日期 大于当月最大值为下月日期
                    if (date_index <= 0 || date_index > per_month_days[m]) {
                        className = "cal_othermonth";
                        calendarTb += '<td id="' + index + '" data="' + calendar.getDateStr(new Date(y, m, date_index)) + '"><font class="' + className + '"></font></td>';
                    } else {
                        className = 'cal_currmonth';
                        calendarTb += '<td id="' + index + '" data="' + calendar.getDateStr(new Date(y, m, date_index)) + '"><font class="' + className + '">' + parseInt(calendar.getDateStr(new Date(y, m, date_index)).split('-')[2]) + '</font></td>';
                    }
                }
                calendarTb += '</tr>';
            }
            calendarTb += '</table>';
            return calendarTb;
        },
        //判断平年，闰年
        isLeap: function(y) {
            return y % 4 === 0 ? (y % 100 !== 0 ? 1 : (y % 400 === 0 ? 1 : 0)) : 0;
        },
        //绑定事件
        /*obj为点击事件本身  dateStr日期字符串 格式：yyyy年mm月 isnext 0为上月 1为下月
         * 返回新的日期字符串 格式:yyyy年mm月
         * */
        changeMonth: function(obj, dateStr, isnext) {
            var y = dateStr.substr(0, 4);
            var m = dateStr.substr(5, 2);
            var newy = parseInt(y), newm = parseInt(m) - 1;
            if (isnext) {
                newm++;
            } else {
                newm--;
            }
            var dateObj = new Date(newy, newm, 1);
            calendar.obj.append(calendar.renderCalendar(dateObj));
            var new_m = parseInt(dateObj.getMonth()) + 1;
            return dateObj.getFullYear() + '年' + (new_m <= 9 ? '0' + new_m : new_m) + '月';
        },
        show: function() {
            calendar.renderCalTitle();
            //初始化为当月
            calendar.obj.append(calendar.renderCalendar(new Date()));
            //月份切换监听
            $(".cal_title a").off('click').on('click', function() {
                var dateStr = $(this).parents(".cal_title").find(".cal_currmonth").html();
                var newdateStr = "";
                if ($(this).hasClass('cal_premonth')) {
                    newdateStr = calendar.changeMonth($(this), dateStr, 0);
                    if (typeof (lastload) === "function") {
                        lastload();
                    }

                } else {
                    newdateStr = calendar.changeMonth($(this), dateStr, 1);
                    if (typeof (nextload) === "function") {
                        nextload();
                    }
                }
                $(this).parents(".cal_title").find(".cal_currmonth").html(newdateStr);
            });
        }
    };
    calendar.show();
}
