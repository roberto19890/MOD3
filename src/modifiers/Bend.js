/**
*
* MOD3  Bend Modifier
*
*
**/

/**[DOC_MD]
 * ###Bend modifier 
 *
 * Bends an object along an axis. 
 *
 * @author Bartek Drozdz
 *  
[/DOC_MD]**/

!function(MOD3, undef){
    
    @@USE_STRICT@@
    
    var NONE = MOD3.ModConstant.NONE, LEFT = MOD3.ModConstant.LEFT,  RIGHT = MOD3.ModConstant.RIGHT,
        Matrix = MOD3.Matrix,  Atan = Math.atan, Atan2 = Math.atan2, Sin = Math.sin, Cos = Math.cos,
        PI = MOD3.Constants.PI, halfPI = MOD3.Constants.halfPI, doublePI = MOD3.Constants.doublePI,
        Point = MOD3.Point
    ;
    
    var Bend = MOD3.Bend = MOD3.Class ( MOD3.Modifier, {
        
        constructor: function( f, o, a ) {
            this.$super('constructor');
            this.name = 'Bend';
            this.constraint = NONE;
            this.max = 0;
            this.min = 0;
            this.mid = 0;
            this.width = 0;
            this.height = 0;
            this.origin = 0;
            this.m1 = null;
            this.m2 = null;
            this.diagAngle = 0;
            this.switchAxes = false;

            this.force = (f!==undef) ? f : 0;
            this.offset = (o!==undef) ? o : 0;
            if (a!==undef) this.setAngle( a );
            else this.setAngle( 0 );
        },
    
        force: 0,
        offset: 0,
        angle: 0,
        diagAngle: 0,
        max: 0,
        min: 0,
        mid: 0,
        width: 0,
        height: 0,
        origin: 0,
        m1: null,
        m2: null,
        switchAxes: false,
        
        dispose: function( ) {
            this.force = null;
            this.offset = null;
            this.angle = null;
            this.diagAngle = null;
            this.max = null;
            this.min = null;
            this.mid = null;
            this.width = null;
            this.height = null;
            this.origin = null;
            this.m1 && this.m1.dispose( );
            this.m2 && this.m2.dispose( );
            this.m1 = null;
            this.m2 = null;
            this.switchAxes = null;
            this.$super('dispose');
            
            return this;
        },
        
        serialize: function( ) {
            return { 
                modifier: this.name, 
                params: {
                    force: this.force,
                    offset: this.offset,
                    angle: this.angle,
                    diagAngle: this.diagAngle,
                    max: this.max,
                    min: this.min,
                    mid: this.mid,
                    width: this.width,
                    height: this.height,
                    origin: this.origin,
                    m1: this.m1.serialize( ),
                    m2: this.m2.serialize( ),
                    switchAxes: this.switchAxes,
                    constraint: this.constraint,
                    enabled: !!this.enabled
                }
            };
            
        },
        
        unserialize: function( json ) {
            if ( json && this.name === json.modifier )
            {
                var params = json.params;
                this.force = params.force;
                this.offset = params.offset;
                this.angle = params.angle;
                this.diagAngle = params.diagAngle;
                this.max = params.max;
                this.min = params.min;
                this.mid = params.mid;
                this.width = params.width;
                this.height = params.height;
                this.origin = params.origin;
                this.m1.unserialize( params.m1 );
                this.m2.unserialize( params.m2 );
                this.switchAxes = params.switchAxes;
                this.constraint = params.constraint;
                this.enabled = !!params.enabled;
            }
            return this;
        },
        
        setAngle: function( a ) { 
            this.angle = a; 
            this.m1 = new Matrix( ).rotate( a );
            this.m2 = new Matrix( ).rotate( -a );
            
            return this;
        },
        
        setModifiable: function( mod ) {
            this.$super("setModifiable", mod);
            
            this.max = (this.switchAxes) ? this.mod.midAxis : this.mod.maxAxis;
            this.min = this.mod.minAxis;
            this.mid = (this.switchAxes) ? this.mod.maxAxis : this.mod.midAxis;
                
            this.width = this.mod.getSize( this.max );    
            this.height = this.mod.getSize( this.mid );
            this.origin = this.mod.getMin( this.max );
            
            this.diagAngle = Atan( this.width / this.height );
            
            return this;
        },
        
        _apply: function( ) {   
            if ( !this.force ) return  this;

            var vs = this.mod.vertices, vc = vs.length,
                constraint = this.constraint,
                width = this.width, 
                offset = this.offset, 
                origin = this.origin, 
                force = this.force, 
                max = this.max, 
                min = this.min, 
                mid = this.mid, 
                m1 = this.m1, 
                m2 = this.m2,
            
                distance = origin + width * offset,
                radius = width / PI / force,
                bendAngle = doublePI * (width / (radius * doublePI)),
                v, vmax, vmid, vmin, np, p, fa, op, ow, np2,
                invwidth = 1.0/width
            ;
            
            // optimize loop using while counting down instead of up
            while ( --vc >= 0 )
            {
                v = vs[ vc ];
                
                vmax = v.getValue( max );
                vmid = v.getValue( mid );
                vmin = v.getValue( min );

                np = m1.transformPointSelf( new Point( vmax, vmid ) );
                vmax = np.x;
                vmid = np.y;

                p = (vmax - origin) * invwidth;

                if (
                    ( (LEFT === constraint) && (p <= offset) ) || 
                    ( (RIGHT === constraint) && (p >= offset) )
                ) 
                {  
                    /* do nothing */ 
                } 
                else 
                {
                    fa = (halfPI - bendAngle * offset) + (bendAngle * p);
                    op = Sin(fa) * (radius + vmin);
                    ow = Cos(fa) * (radius + vmin);
                    vmin = op - radius;
                    vmax = distance - ow;
                }

                np2 = m2.transformPointSelf( new Point( vmax, vmid ) );
                vmax = np2.x;
                vmid = np2.y;
                
                v.setValue( max, vmax );
                v.setValue( mid, vmid );
                v.setValue( min, vmin );
            }
            
            return this;
        }
    });
    
}(MOD3);