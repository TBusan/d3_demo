// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// 生成示例数据
const generateData = () => {
    const size = 100;
    const values = new Float32Array(size * size);
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const x = i / size * 2 - 1;
            const y = j / size * 2 - 1;
            // 创建一个更有趣的地形pattern
            values[i + j * size] = Math.sin(Math.sqrt(x * x + y * y) * 5) +
                                 Math.sin(x * 4) * 0.3 +
                                 Math.cos(y * 4) * 0.3;
        }
    }
    return { values, size };
};

// 创建等值线mesh
const createContourMesh = (contour, height, color) => {
    // 检查轮廓数据是否有效
    if (!contour.coordinates || !contour.coordinates.length) {
        console.warn('Invalid contour data');
        return null;
    }

    try {
        const shapes = [];
        
        // 处理每个轮廓线
        contour.coordinates.forEach(coord => {
            if (!coord || !coord.length || !coord[0].length) {
                return; // 跳过无效数据
            }

            const shape = new THREE.Shape();
            
            // 确保第一个点存在
            if (coord[0][0]) {
                shape.moveTo(coord[0][0][0] * 50, coord[0][0][1] * 50);
                
                // 添加其余的点
                for (let i = 1; i < coord[0].length; i++) {
                    shape.lineTo(coord[0][i][0] * 50, coord[0][i][1] * 50);
                }
                
                // 闭合路径
                shape.closePath();
                shapes.push(shape);
            }
        });

        // 如果没有有效的形状，返回null
        if (shapes.length === 0) {
            console.warn('No valid shapes created');
            return null;
        }

        // 创建拉伸几何体
        const geometry = new THREE.ExtrudeGeometry(shapes[0], {
            depth: Math.abs(height) * 20, // 使用绝对值确保正的深度
            bevelEnabled: false
        });

        // 创建材质
        const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            flatShading: true
        });

        return new THREE.Mesh(geometry, material);
    } catch (error) {
        console.error('Error creating contour mesh:', error);
        return null;
    }
};

function init() {
    // 设置渲染器
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // 设置相机位置
    camera.position.set(0, -100, 100);
    camera.lookAt(0, 0, 0);

    // 生成数据
    const { values, size } = generateData();
    
    // 使用D3生成等值线，调整阈值范围和步长
    const thresholds = d3.range(-2, 2, 0.2); // 增加步长以减少等值线数量
    const contours = d3.contours()
        .size([size, size])
        .thresholds(thresholds)
        (values);

    // 创建等值线组
    const contoursGroup = new THREE.Group();
    
    // 为每个等值线创建mesh
    contours.forEach((contour, i) => {
        const height = contour.value;
        const color = new THREE.Color().setHSL(i / contours.length * 0.8, 1, 0.5);
        const mesh = createContourMesh(contour, height, color);
        
        if (mesh) {  // 只添加有效的mesh
            // 调整位置使等值线居中
            mesh.position.set(-25, -25, 0);
            contoursGroup.add(mesh);
        }
    });

    scene.add(contoursGroup);

    // 添加光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // 添加轨道控制器
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// 窗口大小调整处理
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}