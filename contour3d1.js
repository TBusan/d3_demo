// 1. 初始化 Three.js 场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// 2. 准备数据
const generateData = () => {
    const size = 100;
    const values = new Float32Array(size * size);
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            // 生成示例数据，可以替换为实际数据
            const x = i / size * 2 - 1;
            const y = j / size * 2 - 1;
            values[i + j * size] = Math.sin(Math.sqrt(x * x + y * y) * 5);
        }
    }
    return values;
};

// 3. 使用 D3 生成等值线
const createContours = (values, size, thresholds) => {
    const contours = d3.contours()
        .size([size, size])
        .thresholds(thresholds)
        (values);
    return contours;
};

// 4. 将等值线转换为 Three.js 几何体
const createContourGeometry = (contour, height) => {
    const points = [];
    const shape = new THREE.Shape();
    
    contour.coordinates.forEach((coord, i) => {
        coord[0].forEach((point, j) => {
            if (i === 0 && j === 0) {
                shape.moveTo(point[0], point[1]);
            } else {
                shape.lineTo(point[0], point[1]);
            }
        });
    });

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false
    });
    
    return geometry;
};

// 5. 主要渲染函数
function init() {
    // 设置渲染器
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 设置相机位置
    camera.position.z = 5;

    // 生成数据
    const size = 100;
    const values = generateData();
    
    // 生成等值线
    const thresholds = d3.range(-1, 1, 0.1);
    const contours = createContours(values, size, thresholds);

    // 为每个等值线创建3D对象
    contours.forEach((contour, i) => {
        const height = contour.value * 0.5; // 高度基于值
        const geometry = createContourGeometry(contour, height);
        const material = new THREE.MeshPhongMaterial({
            color: d3.interpolateViridis(i / contours.length),
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
    });

    // 添加光源
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // 添加轨道控制器
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// 6. 窗口大小调整处理
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});