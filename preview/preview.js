/**
 * Created by mary.zhong on 2017/4/12.
 */
    //图片数据
var imgData=[];
$(function(){
    //定义旋转次数
    $(".imgPreview .imgBox").height(window.screen.height-250);
    var rotateCount='';
    var rotateWidth='';
    var rotateHeight='';
    $(".preBtn").off('click').click(function(){
        rotateCount=0;
        getImgData();

       if(imgData.length!=0){
           previewShow();
           $(".imgPreview .imgBox img").remove();
           $(".imgPreview .imgBox").append('<img src="'+imgData[0].src+'" id="normalImg_'+0+'">');
          // imgRate();
           showMinImg(imgData,rotateCount);
           mImgChange();
       }else{
           alert('无预览图');
       }
    });
    $(".imgPreview .imgBox .turnRight").off('click').click(function(){
       var index= parseInt($(".imgPreview .imgBox img").attr('id').split('_')[1]);
        if(index!=imgData.length-1){
            rotateCount=0;

            $(".imgPreview .imgBox img").remove();
            $(".imgPreview .imgBox").append('<img src="'+imgData[index+1].src+'" id="normalImg_'+(index+1)+'">');
           // imgRate();
        }else{
            alert('这是最后一张图了')
        }
    });
    $(".imgPreview .imgBox .turnLeft").off('click').click(function(){
        var index= parseInt($(".imgPreview .imgBox img").attr('id').split('_')[1]);
        if(index!=0){
            rotateCount=0;

            $(".imgPreview .imgBox img").remove();
            $(".imgPreview .imgBox").append('<img src="'+imgData[index-1].src+'" id="normalImg_'+(index-1)+'">');
           // imgRate();
        }else{
            alert('已是第一张图了')
        }
    });
    //图像旋转

    $(".imgPreview .imgCtr .preRotate").off('click').click(function(){
        rotateCount++;

        $(".imgPreview .imgBox img").css('transform','rotate('+rotateCount*90+'deg)');
        if(rotateCount==1){
            rotateWidth=$(".imgPreview .imgBox img").width();
            //rotateHeight=$(".imgPreview .imgBox").height();
        }
        if($(".imgPreview .imgBox img").width()>$(".imgPreview .imgBox img").height()){
            $(".imgPreview .imgBox img").css('width',$(".imgPreview .imgBox").height());
        }else{
            $(".imgPreview .imgBox img").css('width',rotateWidth);
        }
        //console.log(rotateCount);
        //if(rotateCount%2==0){
        //    $(".imgPreview .imgBox").width(rotateWidth);
        //    $(".imgPreview .imgBox").height(rotateHeight);
        //}else{
        //    $(".imgPreview .imgBox").height($(".imgPreview .imgBox").width());
        //    $(".imgPreview .imgBox").width($(".imgPreview .imgBox").height());
        //
        //}

        $(".imgPreview .imgBox img").css({
            'height':$(".imgPreview .imgBox img").width(),
            'max-width':'100%'
    })


    });








    $(window).resize(function(){
        $("#preShadow").css({
            'height':$(document).height()
        });
        //缩略图显示自适应

        $(".imgPreview .imgCtr .minImgBox").width(Math.floor($(".imgPreview .imgCtr .minImgBox").width()/65)*65+5);



    })
});
function previewShow(){
    //遮罩
    if($("#preShadow").length==0){
        $('body').append('<div id="preShadow"></div>');
        $("#preShadow").css({
            'width':'100%',
            'height':$(document).height(),
            'background-color':'#000',
            'position':'absolute',
            'top':'0px',
            'z-index':'10',
            'opacity':'0.5'

        });
    }
    //弹框显示
    $(".imgPreview").show();
    //关闭
    $(".imgPreview .preClose").off('click').click(function(){
        $(".imgPreview").hide();
        $("#preShadow").remove();
    })
}

//获取数据
function getImgData(){
        imgData=[];
    $('.imgShow').find('img').each(function(){
        var imgdata={};
        imgdata.name=$(this).attr('name');
        imgdata.src=$(this).attr('src');
        imgData.push(imgdata);
        return imgData;
    })
}
//设置img显示比例
//function imgRate(){
//    var screenH=window.screen.height;
//    //100px的调节空间
//    if($(".imgPreview .imgBox img").height()> screenH-170){
//        $(".imgPreview .imgBox").height('auto');
//        $(".imgPreview .imgBox img").css('height',screenH-250);
//    }
//    if($(".imgPreview .imgBox img").height()<200){
//
//        $(".imgPreview .imgBox").height('200px');
//        $(".imgPreview .imgBox img").css({
//            'position':'absolute',
//            'top':'50%',
//            'transform':'translateY(-50%)',
//            '-webkit-transform':'translateY(-50%)',
//            '-o-transform':'translateY(-50%)',
//            '-moz-transform':'translateY(-50%)',
//            '-ms-transform':'translateY(-50%)'
//
//        });
//    }
//    if($(".imgPreview .imgBox img").width()<200){
//        $(".imgPreview .imgBox").width('300px');
//    }
//
//}

//显示小图
function showMinImg(imgData,rotateCount){
    var minImgStr='<ul>';
    for(var i=0;i<imgData.length;i++){
        minImgStr+='<li><a href="javascript:showNormImg(\''+i+'\','+rotateCount+')"><img src="'+imgData[i].src+'" id="minImg_'+i+'"></a></li>';
    }
    minImgStr+='</ul>';
    $(".imgPreview .imgCtr .minImg .minImgBox ul").remove();
    $(".imgPreview .imgCtr .minImg .minImgBox").append(minImgStr);

    $(".imgPreview .imgCtr .minImgBox").width(Math.floor($(".imgPreview .imgCtr .minImgBox").width()/65)*65+5);

}


//缩略图轮换
function mImgChange(arg){
    $(".imgPreview .minImg .turnRight").off('click').click(function(){
        changemImg($(this),0)

    });
    $(".imgPreview .minImg .turnLeft").off('click').click(function(){
        changemImg($(this),1)
    });

    //obj 传入点击事件对象 flag 0为右循环轮播 1为左循环轮播
    function changemImg(obj,flag){
        var boxobj=obj.parent().find(".minImgBox");
        //可视的图片个数
        var sImgNum=Math.floor(boxobj.width()/65);
        //ul宽度
        var ulWidth=boxobj.find('ul').width();
        //ul 左移长度
        var leftWidth=parseInt(boxobj.find('ul').css("left").replace('px',''));
        if(flag==0){
            if(Math.abs(leftWidth)+sImgNum*65<ulWidth-5){
                boxobj.find('ul').css("left",leftWidth-sImgNum*65+'px');
            }else{
                alert("无法左移了");
            }
        }else{
            if(leftWidth<0){
                boxobj.find('ul').css("left",leftWidth+sImgNum*65+'px');
            }else{
                alert("无法右移了");
            }
        }

    }

}
//点击缩略图显示相应图像
function showNormImg(i,rotateCount){
    rotateCount=0;

    $(".imgPreview .imgBox img").remove();
    var srcstr=$("#minImg_"+i).attr('src');
    $(".imgPreview .imgBox").append('<img src="'+srcstr+'" id="normalImg_'+i+'">');
   // imgRate();
}



