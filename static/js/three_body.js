// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Events = Matter.Events,
    Body = Matter.Body,
    Composite = Matter.Composite;

// create runner
var runner = Runner.create();

// Custom Gravity Engine
// create an engine
var engine = Engine.create();
engine.world.gravity.y = 0; // Turn off gravity

// Increase gravitational attraction between objects
engine.world.gravity.scale = 0.0000000000001; // Adjust the scale value to make it stronger

let follow_body = true;

let wscale = 1;
let hscale = 1;
if (window.innerWidth > window.innerHeight) {
    wscale = 2/3;
} else {
    hscale = 2/3;
}
// create a renderer
var render = Render.create({
    element: document.getElementById('matter'),
    engine: engine,
    options: {
        width: window.innerWidth*wscale,
        height: window.innerHeight*hscale,
        wireframes: false
    }
});

var canvas = render.canvas;
var ctx=canvas.getContext('2d');

let torus = false;
let tick = 0;
// Add custom gravity function to the onUpdate event
Events.on(runner, 'beforeUpdate', function(event) {
    tick ++;
    var bodies = Composite.allBodies(engine.world);
    if(bodies.length == 0){
        //Set center of screen matter.js to origin
    }
    else if (follow_body){
        //Set the center of matter.js canvas to the first body
        let body = bodies[0];
        // Calculate the new bounds
        var centerX = body.position.x - render.options.width / 2;
        var centerY = body.position.y - render.options.height / 2;
        render.bounds.min.x = centerX;
        render.bounds.min.y = centerY;
        render.bounds.max.x = centerX + render.options.width;
        render.bounds.max.y = centerY + render.options.height;

        // Update the renderer with new bounds
        Render.lookAt(render, {
            min: { x: render.bounds.min.x, y: render.bounds.min.y },
            max: { x: render.bounds.max.x, y: render.bounds.max.y }
        });
        
    }


    //If only one body
    if (false && bodies.length >= 1) {
        //Gravitate to center
        let body = bodies[0];
        let dx = window.innerWidth*wscale/2 - body.position.x;
        let dy = window.innerHeight*hscale/2 - body.position.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let force = (body.mass) / (distance * distance);
        if (distance > 50) {
            Body.applyForce(body, body.position, { x: force * dx / distance, y: force * dy / distance });
        }
        //Apply Friction
        //let friction = .0001;
        //let friction_x = body.velocity.x*friction;
        //let friction_y = body.velocity.y*friction;
        //Body.applyForce(body, body.position, { x: -friction_x, y: -friction_y });
    }
    if (bodies.length > 1) {
        for (var i = 0; i < bodies.length; i++) {
            var bodyA = bodies[i];

            for (var j = i + 1; j < bodies.length; j++) {
                var bodyB = bodies[j];

                // Calculate gravitational force between two bodies
                var dx = bodyB.position.x - bodyA.position.x;
                var dy = bodyB.position.y - bodyA.position.y;
                var distance = Math.sqrt(dx * dx + dy * dy);
                var force = (bodyA.mass * bodyB.mass) / (distance * distance);
                
                // Apply force to each body
                Body.applyForce(bodyA, bodyA.position, { x: force * dx / distance, y: force * dy / distance });
                Body.applyForce(bodyB, bodyB.position, { x: -force * dx / distance, y: -force * dy / distance });
            }
        }
    }
    //If body is out of bounds, teleport it to the other side
    let limit_x = window.innerWidth*wscale;
    let limit_y = window.innerHeight*hscale;
    if (torus) {
        for (var i = 0; i < bodies.length; i++) {
            if (bodies[i].position.x < 0) {
                Body.setPosition(bodies[i], { x: limit_x, y: bodies[i].position.y });
            } else if (bodies[i].position.x > limit_x) {
                Body.setPosition(bodies[i], { x: 0, y: bodies[i].position.y });
            }
            if (bodies[i].position.y < 0) {
                Body.setPosition(bodies[i], { x: bodies[i].position.x, y: limit_y });
            } else if (bodies[i].position.y > limit_y) {
                Body.setPosition(bodies[i], { x: bodies[i].position.x, y: 0 });
            }
        }
    }else if (bodies.length > 2){
        //Delete objects when they go out of bounds
        let canvasCenterX = (render.bounds.min.x + render.bounds.max.x) / 2;
        let canvasCenterY = (render.bounds.min.y + render.bounds.max.y) / 2;

        let deletionDistance = Math.max(render.options.width, render.options.height) * 3;
        bodies.forEach(body => {
        let dx = body.position.x - canvasCenterX;
        let dy = body.position.y - canvasCenterY;
        let distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distanceFromCenter > deletionDistance) {
            Composite.remove(engine.world, body);
        }
    });

    }
    
    // Update Body Counter
    document.getElementById('body-counter').innerHTML = 'Number of Bodies: ' + bodies.length;

    if (tick % 30 == 0) {
        // Update position of every object in the stats panel rounded to 5 decimals
        let stats_panel = document.getElementById('stats');
        let positions = '';
        for (var i = 0; i < bodies.length; i++) {
            let velocity = Math.sqrt(bodies[i].velocity.x*bodies[i].velocity.x + bodies[i].velocity.y*bodies[i].velocity.y);
            positions += 'Object ' + (i + 1) + ': (' + bodies[i].position.x.toFixed(2) + ', ' + bodies[i].position.y.toFixed(2) + ') Velocity: '+velocity.toFixed(2)+' <br>';
        }
        stats_panel.innerHTML = positions;
    }
});
    

// Function to generate a sphere with proportional mass
function generateSphere(x, y, radius, kick=0.1) {
    var sphere = Bodies.circle(x, y, radius, { mass: Math.sqrt(Math.PI * radius)});
    sphere.friction = 0;
    sphere.frictionAir = 0;
    sphere.frictionStatic = 0;
    //Apply a random kick to the sphere in any direction
    if (kick > 0){
        //If are no bodies on the canvas
        if (Composite.allBodies(engine.world).length == 0) {
            //pass
        }else if (Composite.allBodies(engine.world).length == 1) {
            console.log("Activated")
            //Make a kick that is tangential to the first body
            let first_body = Composite.allBodies(engine.world)[0];
            let dx = first_body.position.x - x;
            let dy = first_body.position.y - y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            //Find the perpendicular vector
            let perp_x = -dy/Math.abs(dy);
            let perp_y = dx/Math.abs(dx);
            //Apply the kick
            if (sphere.velocity != NaN){
                Body.applyForce(sphere, { x: x, y: y }, { x: perp_x*kick, y: perp_y*kick });
            }
        }else{
            Body.applyForce(sphere, { x: x, y: y }, { x: (Math.random() - 0.5)*kick, y: (Math.random() - 0.5)*kick });
        }
    }
    Composite.add(engine.world, sphere);
}



let eat = false;
Events.on(engine, 'collisionStart', function(event) {
    var pairs = event.pairs;
    if (eat){
    // Combine each pair of colliding bodies
    pairs.forEach(function(pair) {
        var bodyA = pair.bodyA;
        var bodyB = pair.bodyB;

        // Calculate the midpoint for the new body
        var newX = (bodyA.position.x + bodyB.position.x) / 2;
        var newY = (bodyA.position.y + bodyB.position.y) / 2;

        // Calculate the combined mass
        var newMass = bodyA.mass + bodyB.mass;

        // Calculate combined velocity using conservation of momentum
        var newVelocityX = (bodyA.velocity.x * bodyA.mass + bodyB.velocity.x * bodyB.mass) / newMass;
        var newVelocityY = (bodyA.velocity.y * bodyA.mass + bodyB.velocity.y * bodyB.mass) / newMass;

        // Create a new body with the combined mass and velocity
        var newRadius = bodyA.circleRadius + bodyB.circleRadius;
        var newBody = Bodies.circle(newX, newY, newRadius, { 
            mass: newMass,
            friction: 0,
            frictionAir: 0,
            frictionStatic: 0
        });
        Body.setVelocity(newBody, { x: newVelocityX, y: newVelocityY });

        // Add the new body to the world
        Composite.add(engine.world, newBody);

        // Remove the original bodies
        Composite.remove(engine.world, bodyA);
        Composite.remove(engine.world, bodyB);
    });
    }
});


// run the renderer
Render.run(render);

// run the engine
Runner.run(runner, engine);

// Add a listener for when the mouse is clicked to add a sphere onto the canvas
document.addEventListener('click', function(event) {
    var mouseX = event.clientX - render.canvas.offsetLeft + render.bounds.min.x;
    var mouseY = event.clientY - render.canvas.offsetTop + render.bounds.min.y;

    // Check if mouse click is within the canvas world bounds
    if (mouseX > render.bounds.min.x && mouseX < render.bounds.max.x &&
        mouseY > render.bounds.min.y && mouseY < render.bounds.max.y) {
        
        // Generate sphere at the correct location
        var radius = Math.random() * 10 + 5; // Random radius between 5 and 15
        generateSphere(mouseX, mouseY, radius);
    }
});


const clear_bodies = ()=>{
    console.log('cleared');
    Composite.clear(engine.world);
}

const restart = ()=>{
    clear_bodies();
    // Generate three spheres randomly placed on the canvas
    for (var i = 0; i < 2; i++) {
        var x = window.innerWidth*wscale/2 + window.innerWidth*wscale/10*(i);
        var y = window.innerHeight*hscale/2 + window.innerHeight*hscale/10*(i);
        var radius = 50/(2*i+1); // Random radius between 20 and 70
        generateSphere(x, y, radius,kick=i*.05);
        if (i==0){
            //Apply a force opposite to the second sphere to make them repel
            let sphere = Composite.allBodies(engine.world)[0];
            let dx = sphere.position.x - window.innerWidth*wscale/2 + window.innerWidth*wscale/10;
            let dy = sphere.position.y - window.innerHeight*hscale/2 + window.innerHeight*hscale/10;
            let distance = Math.sqrt(dx * dx + dy * dy);
            let force = .1*(sphere.mass) / (distance);
            Body.applyForce(sphere, sphere.position, { x: -force * dx / distance, y: .5*force * dy / distance });

        }
    }
}

const torus_mode = ()=>{
    torus = true;
}
const plane = ()=>{
    torus = false;
}
const eat_mode = ()=>{
    restart();
    eat = true;
}
const bounce = ()=>{
    eat = false;
}

const follow_mode = ()=>{
    follow_body = true;
}
const unfollow_mode = ()=>{
    follow_body = false;
}


restart()