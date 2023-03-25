const assetPrefix = 'https://cdn.jsdelivr.net/gh/Crusaders-of-Rust/corCTF-2022-public-challenge-archive@master/web/msfroggenerator/task/img/';
const assets = ['base', 'msanger', 'msdrops', 'mseyes' , 'mskiss', 'msnose', 'mspoop', 'mstongue'];
const assetMap = new Map();
const state = new Map();
let id = 0;

function sync(layer) {
    for (const id of state.keys()) {
        const decorator = layer.findOne('#' + id);
        const {x, y} = decorator.getAbsolutePosition();
        state.set(decorator.getId(), {
            x,
            y,
            zIndex: decorator.zIndex(),
            type: decorator.name()
        });
    }
}

function getDecorator(original, {x, y, zIndex} = {}) {
    const decoratorId = (id++).toString();
    const clone = original.clone({
        name: original.name(),
        id: decoratorId,
        x: x ?? original.getAbsolutePosition().x,
        y: y ?? original.getAbsolutePosition().y,
        zIndex: zIndex,
        draggable: true
    });
    clone.on('click', e => {
        if (e.evt.button === 2) {
            if (clone.name() === 'base') return;
            clone.destroy();
            state.delete(decoratorId);
        } else {
            clone.moveToTop();
        }
    });
    state.set(decoratorId, {});
    return clone;
}

function getButton(x, y, width, height, text) {
    const button = new Konva.Group({ x, y });
    button.add(new Konva.Rect({
        width,
        height,
        fill: '#D3D3D3'
    }));
    button.add(new Konva.Text({
        fontSize: 24,
        width,
        height,
        verticalAlign: 'middle',
        align: 'center',
        text: text,
        fill: '#F0F0F0',
        fontStyle: 'bold'
    }));
    return button;
}

async function load() {
    for (const asset of assets) {
        const image = await new Promise(resolve => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.src = assetPrefix + asset + ".png";
        });
        assetMap.set(asset, image);
    }
}

if (window.innerWidth < 1280 || window.innerHeight < 720) {
    document.getElementById('container').innerText = 'Your screen must be at least 1280x720!';
    throw new Error('screen too small!');
}

(async() => {
    await load();

    const [width, height] = [1280, 720];

    const stage = new Konva.Stage({
        container: 'container',
        width: width,
        height: height,
    });

    stage.on('contextmenu', e => e.evt.preventDefault());

    const baseLayer = new Konva.Layer();
    const decoratorLayer = new Konva.Layer();
    baseLayer.add(new Konva.Rect({
        x: 0,
        y: 0,
        width: width,
        height: height,
        fill: '#F0F0F0'
    }));
    baseLayer.add(new Konva.Text({
        x: 20,
        y: 20,
        fontSize: 24,
        text: 'Right-click to delete a decorator.',
        fill: '#D3D3D3',
        fontStyle: 'bold'
    }));
    const exportButton = getButton(width - 20 - 150, height - 20 - 50, 150, 50, 'Export');
    exportButton.on('click', () => {
        const bg = new Konva.Rect({
            x: 0,
            y: 0,
            width: width,
            height: height,
            fill: '#F0F0F0'
        });
        decoratorLayer.add(bg);
        bg.moveToBottom();
        decoratorLayer.toDataURL({
            pixelRatio: 1,
            callback: url => {
                bg.destroy();
                const link = document.createElement('a');
                link.hidden = true;
                link.href = url;
                link.download = 'export.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                delete link;
            }
        });
    });
    baseLayer.add(exportButton);
    const shareButton = getButton(width - 20 - 150 - 20 - 150, height - 20 - 50, 150, 50, 'Share');
    shareButton.on('click', async () => {
        sync(decoratorLayer);
        const exportState = Object.values(Object.fromEntries(state));
        const id = await (await fetch('/api/create', {
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(exportState)
        })).text();
        return window.location.href = '/?id=' + id;
    })
    baseLayer.add(shareButton);
    stage.add(baseLayer);

    let offset = 20;
    for (let asset of assets) {
        if (asset === 'base') continue;
        const img = assetMap.get(asset);
        const decoratorTemplate = new Konva.Image({
            name: asset,
            x: offset,
            y: height - img.height - 20,
            image: img,
            draggable: true
        });
        decoratorTemplate.on('dragstart', () => {
            decoratorTemplate.stopDrag();
            if (state.size === 100) {
                alert('Max decoration limit reached!');
                return;
            }
            const clone = getDecorator(decoratorTemplate);
            clone.off('dragstart');
            decoratorLayer.add(clone);
            clone.startDrag();
        })
        baseLayer.add(decoratorTemplate);
        offset += img.width + 20;
    }
    stage.add(decoratorLayer);

    const shareId = new URL(window.location.href).searchParams.get('id');
    if (shareId && shareId.match(/^[A-Za-z0-9_-]{10}$/)) {
        let res = await (await fetch('/api/get?id=' + shareId)).json();
        res = res.sort((a, b) => a.zIndex - b.zIndex);

        if (res.length) {
            // name is validated, type is not
            for (const {type, x, y} of res) {
                const decoratorId = (id++).toString();
                const decorator = new Konva.Image({
                    name: type,
                    id: decoratorId,
                    x,
                    y,
                    draggable: true,
                    image: assetMap.get(type)
                });
                decorator.on('click', e => {
                    if (e.evt.button === 2) {
                        if (decorator.name() === 'base') return;
                        decorator.destroy();
                        state.delete(decoratorId);
                    } else {
                        decorator.moveToTop();
                    }
                });
                state.set(decoratorId, {});
                decoratorLayer.add(decorator);
            }
        }
    }

    if (!state.size) {
        decoratorLayer.add(new Konva.Image({
            name: 'base',
            id: (id++).toString(),
            x: width / 2 - assetMap.get('base').width / 2,
            y: height / 2 - assetMap.get('base').height / 2,
            image: assetMap.get('base'),
            draggable: true,
        }));
        state.set('0', {});
    }

    window.decoratorLayer = decoratorLayer;
})();
