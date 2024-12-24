// 示例数据 - 你需要根据实际情况提供网格化的数据点
const generateGridData = () => {
    const features = [];
    // 创建一个20x20的网格
    for (let i = 0; i < 20; i++) {
        for (let j = 0; j < 20; j++) {
            // 基础经纬度范围
            const lon = 120 + (i * 0.1);
            const lat = 30 + (j * 0.1);
            
            // 生成示例值 (使用正弦函数生成波浪形的值)
            const value = 50 + 
                25 * Math.sin(i / 2) + 
                25 * Math.cos(j / 2);
            
            features.push({
                type: 'Feature',
                properties: {
                    value: value
                },
                geometry: {
                    type: 'Point',
                    coordinates: [lon, lat]
                }
            });
        }
    }
    return {
        type: 'FeatureCollection',
        features: features
    };
};

// 初始化地图和等值线
const initContourMap = () => {
    // 创建viewer
    const viewer = new Cesium.Viewer('cesiumContainer', {
        terrainProvider: Cesium.createWorldTerrain()
    });

    // 生成网格数据
    const points = generateGridData();

    // 定义等值线间隔
    const breaks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

    // 生成等值线
    const contours = turf.isolines(points, breaks, {
        zProperty: 'value'
    });

    // 定义颜色范围
    const colors = [
        Cesium.Color.BLUE,
        Cesium.Color.LIGHTBLUE,
        Cesium.Color.WHITE,
        Cesium.Color.ORANGE,
        Cesium.Color.RED
    ];

    // 添加等值线和填充区域
    contours.features.forEach((feature, index) => {
        const coordinates = feature.geometry.coordinates;
        
        // 计算当前等值线的颜色
        const colorIndex = (index / (breaks.length - 1)) * (colors.length - 1);
        const color1 = colors[Math.floor(colorIndex)];
        const color2 = colors[Math.min(Math.ceil(colorIndex), colors.length - 1)];
        const fraction = colorIndex - Math.floor(colorIndex);
        const color = Cesium.Color.lerp(color1, color2, fraction, new Cesium.Color());

        // 添加等值线
        viewer.entities.add({
            polyline: {
                positions: Cesium.Cartesian3.fromDegreesArray(coordinates.flat()),
                width: 2,
                material: new Cesium.ColorMaterialProperty(color.withAlpha(0.8)),
                clampToGround: true
            }
        });

        // 添加填充区域
        if (index < contours.features.length - 1) {
            const nextCoordinates = contours.features[index + 1].geometry.coordinates;
            const polygon = coordinates.concat(nextCoordinates.reverse());
            
            viewer.entities.add({
                polygon: {
                    hierarchy: Cesium.Cartesian3.fromDegreesArray(polygon.flat()),
                    material: color.withAlpha(0.3),
                    classificationType: Cesium.ClassificationType.TERRAIN
                }
            });
        }
    });

    // 设置相机位置
    viewer.camera.setView({
        destination: Cesium.Rectangle.fromDegrees(119.5, 29.5, 120.5, 30.5)
    });
};

// 页面加载完成后初始化
window.onload = initContourMap;