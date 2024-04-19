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

let configure_particles = true;
let torus = false;
let follow_body = true;
let follow_one = false;
let tick = 0;
let panning_momenum = 0;
let panning_velocity = 0;

const get_center_of_mass = ()=>{
    let bodies = Composite.allBodies(engine.world);
    let center_x = 0;
    let center_y = 0;
    let total_mass = 0;
    bodies.forEach(body => {
        center_x += body.position.x*body.mass;
        center_y += body.position.y*body.mass;
        total_mass += body.mass;
    });
    if (total_mass > 0){
        center_x /= total_mass;
        center_y /= total_mass;
    }else{
        //Set to the center of the render window
        center_x = render.options.width / 2;
        center_y = render.options.height / 2;
    }
    return {x:center_x, y:center_y};

}

// Add custom gravity function to the onUpdate event
Events.on(runner, 'beforeUpdate', function(event) {
    tick ++;
    var bodies = Composite.allBodies(engine.world);
    if(bodies.length == 0){
        //Set center of screen matter.js to origin
    }
    else if (follow_body){
        //Calculate the center of mass
        
        let center = get_center_of_mass();
        let center_x = center.x;
        let center_y = center.y;

        // Re-calculate center of mass but now penalize far objects from the center. 
        // This is to make the camera focus on the center of mass of the system
        let penalized_center_x = 0;
        let penalized_center_y = 0;
        let penalized_total_mass = 0;
        if (bodies.length > 1){
            bodies.forEach(body => {
                let dx = body.position.x - center_x;
                let dy = body.position.y - center_y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let penalty = Math.pow(distance, 2);
                penalized_center_x += body.position.x*body.mass/penalty;
                penalized_center_y += body.position.y*body.mass/penalty;
                penalized_total_mass += body.mass/penalty;
            });
            penalized_center_x /= penalized_total_mass;
            penalized_center_y /= penalized_total_mass;
        }else{
            penalized_center_x = center_x;
            penalized_center_y = center_y;
            penalized_total_mass = total_mass;
        }



        // Calculate the new bounds
        var current_center_x = (render.bounds.min.x + render.bounds.max.x) / 2;
        var current_center_y = (render.bounds.min.y + render.bounds.max.y) / 2;

        let dx = current_center_x - penalized_center_x;
        let dy = current_center_y - penalized_center_y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        dx = dx/distance;
        dy = dy/distance;
        
        let scale = Math.sqrt(distance);
        render.bounds.min.x -= dx*scale;
        render.bounds.min.y -= dy*scale;
        render.bounds.max.x -= dx*scale;
        render.bounds.max.y -= dy*scale;
        /*
        if (distance > 1){
            panning_momenum += .1;
            if (panning_momenum > 1){
                panning_momenum = 1;
            }
        }else{
            panning_momenum = 0;
        }
        */
        // Update the renderer with new bounds to focus on the center of mass
        Render.lookAt(render, {
            min: { x: render.bounds.min.x, y: render.bounds.min.y },
            max: { x: render.bounds.max.x, y: render.bounds.max.y }
        });
        
    } else if (follow_one){
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
    let canvasCenterX = (render.bounds.min.x + render.bounds.max.x) / 2;
    let canvasCenterY = (render.bounds.min.y + render.bounds.max.y) / 2;
    let limit_x_lower = canvasCenterX - window.innerWidth*wscale/2;
    let limit_y_lower = canvasCenterY - window.innerHeight*hscale/2;
    let limit_x_upper = canvasCenterX + window.innerWidth*wscale/2;
    let limit_y_upper = canvasCenterY + window.innerHeight*hscale/2;

    if (torus) {
        for (var i = 0; i < bodies.length; i++) {
            let body = bodies[i];
            if (body.position.x < limit_x_lower) {
                Body.setPosition(body, { x: limit_x_upper, y: body.position.y });
            } else if (body.position.x > limit_x_upper) {
                Body.setPosition(body, { x: limit_x_lower, y: body.position.y });
            }
            if (body.position.y < limit_y_lower) {
                Body.setPosition(body, { x: body.position.x, y: limit_y_upper });
            } else if (body.position.y > limit_y_upper) {
                Body.setPosition(body, { x: body.position.x, y: limit_y_lower });
            }
        }
    }else if (bodies.length > 2){
        //Delete objects when they go out of bounds

        let deletionDistance = Math.max(render.options.width, render.options.height) * 2;
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
function generateSphere(x, y, radius, kick=0.2) {
    var sphere = Bodies.circle(x, y, radius, { mass: Math.sqrt(Math.PI * radius)});
    sphere.friction = 0;
    sphere.frictionAir = 0;
    sphere.frictionStatic = 0;
    //Apply a random kick to the sphere in any direction
    if (kick > 0){
        //If are no bodies on the canvas
        if (Composite.allBodies(engine.world).length == 0) {
            //pass
        }else{
            console.log("Activated")
            //Make a kick that is tangential to the center of mass
            let center = get_center_of_mass();
            let dx = center.x - x;
            let dy = center.y - y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            //Find the perpendicular vector
            let perp_x = -dy/Math.abs(dy);
            let perp_y = dx/Math.abs(dx);
            //Apply the kick
            kick=.5 + Math.random();
            if (sphere.velocity != NaN){
                Body.applyForce(sphere, { x: x, y: y }, { x: perp_x*kick/Math.sqrt(distance), y: perp_y*kick/Math.sqrt(distance) });
            }
        }
        //Body.applyForce(sphere, { x: x, y: y }, { x: (Math.random() - 0.5)*kick, y: (Math.random() - 0.5)*kick });
        
    }
    Composite.add(engine.world, sphere);
    return sphere;
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

        if (configure_particles){
            //Get form values of xVelocity, yVelocity, and radius
            var xVelocity = parseFloat(document.getElementById('xVelocity').value);
            var yVelocity = parseFloat(document.getElementById('yVelocity').value);
            var radius = parseFloat(document.getElementById('mass').value);
            if (isNaN(xVelocity)){
                xVelocity = 0;
            }
            if (isNaN(yVelocity)){
                yVelocity = 0;
            }
            if (isNaN(radius)){
                radius = 5;
            }
            let sphere = generateSphere(mouseX, mouseY, radius, kick=0);
            //Give sphere the velocity specified by the form
            Body.setVelocity(sphere, { x: xVelocity, y: yVelocity });
        }else{
            generateSphere(mouseX, mouseY, Math.random()*10+5);
        }
    }else{
        console.log('out of bounds' + mouseX + ' ' + mouseY + ' ' + render.bounds.min.x + ' ' + render.bounds.max.x + ' ' + render.bounds.min.y + ' ' + render.bounds.max.y);
    }
});


const clear_bodies = ()=>{
    console.log('cleared');
    Composite.clear(engine.world);

    // Set the bounds to the center of the original canvas
    let centerX = render.options.width / 2;
    let centerY = render.options.height / 2;
    let halfWidth = render.options.width / 2;
    let halfHeight = render.options.height / 2;
    render.bounds.min.x = centerX - halfWidth;
    render.bounds.min.y = centerY - halfHeight;
    render.bounds.max.x = centerX + halfWidth;
    render.bounds.max.y = centerY + halfHeight;

    // Update the renderer with new bounds to look at the center
    Render.lookAt(render, {
        min: { x: centerX - halfWidth, y: centerY - halfHeight },
        max: { x: centerX + halfWidth, y: centerY + halfHeight }
    });
    
}

const restart = ()=>{
    clear_bodies();
    starting_velocity = 4;
    // Generate three spheres randomly placed on the canvas
    center_x = render.options.width / 2;
    center_y = render.options.height / 2;
    for (var i = 0; i < 3; i++) {
        if (i==0){
            generateSphere(center_x, center_y, 50,kick=0);
        }else if (i==1){
            let sphere = generateSphere(center_x+100, center_y+100, 10,kick=0);
            //Set the velocity to be tangential to the center of mass
            let dx = center_x - sphere.position.x;
            let dy = center_y - sphere.position.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            //Find the perpendicular vector
            let perp_x = -dy/Math.abs(dy)*starting_velocity;
            let perp_y = dx/Math.abs(dx)*starting_velocity;
            //Apply the velocity
            Body.setVelocity(sphere, { x: perp_x, y: perp_y });
        }else if (i==2){
            let sphere = generateSphere(center_x-100, center_y-100, 10,kick=0);
            //Set the velocity to be tangential to the center of mass
            let dx = center_x - sphere.position.x;
            let dy = center_y - sphere.position.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            //Find the perpendicular vector
            let perp_x = -dy/Math.abs(dy)*starting_velocity;
            let perp_y = dx/Math.abs(dx)*starting_velocity;
            //Apply the velocity
            Body.setVelocity(sphere, { x: perp_x, y: perp_y });
        }else if (i==3){
            let sphere = generateSphere(center_x-110, center_y-110, 5,kick=0);
            //Set the velocity to be tangential to the center of mass
            let dx = center_x - sphere.position.x;
            let dy = center_y - sphere.position.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            //Find the perpendicular vector
            let perp_x = -dy/Math.abs(dy)*starting_velocity*.9;
            let perp_y = dx/Math.abs(dx)*starting_velocity*.9;
            //Apply the velocity
            Body.setVelocity(sphere, { x: perp_x, y: perp_y });
        }
    }
}

const torus_mode = ()=>{
    torus = true;
    unfollow_mode();
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
const configure_particles_mode = ()=>{
    if (configure_particles){
        configure_particles=false;
    }else{
        configure_particles = true;
    }
    let ele = document.getElementById("configure-particles-button")
    //Change text to "Configure Particles" or "Randomize Particles"
    if (configure_particles){
        ele.innerHTML = "Randomize Particles";
        document.getElementById('mass').disabled = false;
        document.getElementById('xVelocity').disabled = false;
        document.getElementById('yVelocity').disabled = false;
    }else{
        ele.innerHTML = "Configure Particles";
        document.getElementById('mass').disabled = true;
        document.getElementById('xVelocity').disabled = true;
        document.getElementById('yVelocity').disabled = true;
    }

}
configure_particles_mode();
restart()