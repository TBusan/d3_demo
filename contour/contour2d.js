// 配置参数
const config = {
    width: 800,
    height: 600,
    margin: { top: 20, right: 20, bottom: 30, left: 40 },
    gridSize: 100,  // 网格大小
    colors: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000']  // 颜色范围
};

// 生成示例数据
function generateData() {
    const data = new Float32Array(config.gridSize * config.gridSize);
    
    for (let i = 0; i < config.gridSize; i++) {
        for (let j = 0; j < config.gridSize; j++) {
            const x = (i / config.gridSize) * 2 - 1;
            const y = (j / config.gridSize) * 2 - 1;
            
            // 创建一个有趣的地形pattern
            data[i + j * config.gridSize] = 
                Math.sin(Math.sqrt(x * x + y * y) * 5) +
                Math.sin(x * 4) * 0.3 +
                Math.cos(y * 4) * 0.3;
        }
    }
    return data;
}

// 初始化SVG
function createSVG() {
    const svg = d3.select('#map')
        .append('svg')
        .attr('width', config.width)
        .attr('height', config.height)
        .attr('class', 'contour-map');

    // 添加一个用于缩放的容器组
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);

    // 添加实际绘制内容的组
    const contentG = g.append('g')
        .attr('class', 'content');

    return { svg, g, contentG };
}

// 创建颜色比例尺
function createColorScale(thresholds) {
    return d3.scaleLinear()
        .domain(d3.extent(thresholds))
        .range([0, 1])
        .interpolate(d3.interpolateHcl);
}

// 主函数
function init() {
    // 生成数据
    const values = generateData();
    
    // 计算实际绘图区域大小
    const width = config.width - config.margin.left - config.margin.right;
    const height = config.height - config.margin.top - config.margin.bottom;

    // 创建SVG和分组
    const { svg, g, contentG } = createSVG();

    // 创建等值线生成器
    const thresholds = d3.range(-2, 2, 0.1);
    const contours = d3.contours()
        .size([config.gridSize, config.gridSize])
        .thresholds(thresholds);

    // 创建颜色比例尺
    const colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(thresholds));

    // 创建缩放比例
    const xScale = d3.scaleLinear()
        .domain([0, config.gridSize])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, config.gridSize])
        .range([height, 0]);

    // 创建缩放行为
    const zoom = d3.zoom()
        .scaleExtent([0.2, 20])
        .on('zoom', (event) => {
            contentG.attr('transform', event.transform);
            
            // 更新坐标轴
            g.select('.x-axis').call(xAxis.scale(event.transform.rescaleX(xScale)));
            g.select('.y-axis').call(yAxis.scale(event.transform.rescaleY(yScale)));
        });

    // 应用缩放行为
    svg.call(zoom);

    // 绘制等值线
    contentG.selectAll('path')
        .data(contours(values))
        .enter()
        .append('path')
        .attr('d', d3.geoPath(d3.geoIdentity()
            .scale(width / config.gridSize)
            .translate([0, 0])))
        .attr('fill', d => colorScale(d.value))
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.8);

    // 添加坐标轴
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);

    g.append('g')
        .attr('class', 'y-axis')
        .call(yAxis);

    // 添加图例
    const legendWidth = 20;
    const legendHeight = height;
    
    const legend = svg.append('g')
        .attr('transform', `translate(${width + 20}, 0)`);

    const legendScale = d3.scaleLinear()
        .domain(d3.extent(thresholds))
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(10);

    // 创建渐变色图例
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', legendHeight)
        .attr('y2', 0);

    // 添加渐变色停止点
    const stops = d3.range(0, 1.1, 0.1);
    stops.forEach(stop => {
        gradient.append('stop')
            .attr('offset', `${stop * 100}%`)
            .attr('stop-color', colorScale(stop * (thresholds[thresholds.length - 1] - thresholds[0]) + thresholds[0]));
    });

    // 绘制图例矩形
    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#legend-gradient)');

    // 添加图例轴
    legend.append('g')
        .attr('transform', `translate(${legendWidth},0)`)
        .call(legendAxis);
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init); 