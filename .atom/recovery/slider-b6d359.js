define([
  './morphBase.js',
  '../../../libs/underscore.js'
],
function(
  MorphBase,
  _
) {

const Slider = MorphBase.extend({
  initialize(param, theme, morphMgr) {
    MorphBase.call(this, param, theme, morphMgr);
    
    const { sliderSpace, logicSpace, orient } = param;

    // container
    const containerEle = document.createElement('div');
    containerEle.style.position ="absolute";
    containerEle.style.zIndex = 1;
    containerEle.style.left = `${sliderSpace.x}px`;
    containerEle.style.top = `${sliderSpace.y}px`;
    containerEle.style.height = `${sliderSpace.height}px`;
    containerEle.style.width = `${sliderSpace.width}px`;

    const { platform } = morphMgr.chart.UDData;
    if (platform === 'mobile') {
      containerEle.className = `${orient}_slider_container_mobile`;
    } else {
      containerEle.className = `${orient}_slider_container`;
    }

    // indicator
    const indicatorEle = document.createElement('div');
    indicatorEle.setAttribute('draggable', true);
    indicatorEle.className = `${orient}_slider_indicator`;
    indicatorEle.style.position = 'absolute';
    indicatorEle.style.zIndex = 2;
    indicatorEle.style.backgroundColor = 'rgba(20, 150, 212, 0.3)';
    containerEle.appendChild(indicatorEle);
    let indicatorPos;
    const scrollEvent = { eventType: 'logic', type:"moveBy", dx:0, dy:0, x:0, y:0 };
    indicatorEle.addEventListener('dragstart', function(e) {
      indicatorPos = e.screenX;
    });
    indicatorEle.addEventListener('drag', e => {
      if (e.screenX) {
        const indicatorStyle = getComputedStyle(indicatorEle);
        const indicatorWidth = Number.parseFloat(indicatorStyle.width);
        let newPosition =  Number.parseFloat(indicatorStyle.left) - indicatorPos + e.screenX;
        if (newPosition < 0) {
          newPosition = 0;
        } else if (newPosition > sliderSpace.width - indicatorWidth) {
          newPosition = sliderSpace.width - indicatorWidth;
        } else {
          indicatorPos = e.screenX;
        }
        scrollEvent.orient = 'horizontal';
        scrollEvent.dx = (Number.parseFloat(indicatorStyle.left) - newPosition) / sliderSpace.width * logicSpace.width;
        scrollEvent.dy = 0;
        this.notify("output", scrollEvent);
        indicatorEle.style.left = `${newPosition}px`;
      }
    });

    const left = document.createElement('div');
    // TODO: 
    
    const right = document.createElement('div');
    right.setAttribute('draggable', true);
    right.style.position = 'absolute';
    right.style.width = '10px';
    right.style.height = '50px';
    right.style.zIndex = 3;
    right.style.backgroundColor = 'rgba(20, 150, 212, 0.5)';
    indicatorEle.appendChild(right);
    // let prevPos;
    // right.addEventListener('dragstart', function(e) {
    //   prevPos = e.screenX;
    // });
    // right.addEventListener('drag', _.throttle(function(e) {
    //   // TODO: notify when re-render finishend
    //   if (e.screenX) {
    //     indicatorEle.style.width = `${Number.parseFloat(indicatorEle.style.width) - prevPos + e.screenX}px`;
    //     right.style.left = `${Number.parseFloat(right.style.left) - prevPos + e.screenX}px`;
    //   }
    //   // chart.notify('input', {
    //   //   type: 'updateRange',
    //   //   range: indicatorEle.style.width / sliderSpace.width,
    //   // });
    //   prevPos = e.screenX;
    //   e.preventDefault();
    // }), 100);
    // right.addEventListener('dragover', function(e) {
    //   e.preventDefault();
    // });

    Object.assign(this, { sliderSpace, containerEle, indicatorEle });

    this.update(param, theme, morphMgr);
  },

  update(param, theme, morphMgr) {
    const { sliderSpace, logicSpace, orient } = param;
    const { indicatorEle } = this;

    indicatorEle.style.left = `${-10}px`;
    indicatorEle.style.top = `0px`;
    indicatorEle.style.width = `${sliderSpace.width / logicSpace.width * sliderSpace.width}px`;
    indicatorEle.style.height = `${sliderSpace.height}px`;

    // right.style.left = `${Number.parseFloat(indicatorEle.style.width)}px`;
  },

  renderThumb(chart) {
    const { containerEle } = this;
    const { width, height } = getComputedStyle(containerEle);
    const { UDData } = chart;
    const thumbOption = Object.assign({}, JSON.parse(JSON.stringify(UDData)), {
      container: containerEle,
      area: { width: Number.parseFloat(width), height: Number.parseFloat(height) },
      setting: {
        view: "entire-view"
      },
    });
    const { cells } = thumbOption;
    const cell = cells[0][0];
    const { marks, axes } = cell;
    const mark = marks[0];
    // mark type is line
    mark.type = 'line';
    mark.smooth = true;
    const { className } = mark;
    thumbOption.theme.classStyle[className].mark.size = null;
    cell.marks = [mark];
    // hide axes
    axes && axes.forEach(axis => {
      axis.forceHidden = true;
    });
    thumbOption.cells = [[cell]];
    // remove legends
    thumbOption.theme.legends = null;
    // remove grid
    thumbOption.graph.axisGridX.className = 'thumbGrid';
    thumbOption.graph.axisGridY.className = 'thumbGrid';
    thumbOption.theme.classStyle.thumbGrid = {
      strokeStyle: { r: 0, g: 0, b: 0, a: 0 },
    };
    // remove title trees
    delete thumbOption.colTitleTree;
    delete thumbOption.rowTitleTree;
    const event = { eventType: 'logic', type: 'renderThumb', option: thumbOption };
    chart.notify('input', event);
  }
});

return Slider;

});