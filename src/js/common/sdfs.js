export default `

  //04
  float stroke(float x, float s, float w){
    float d = step(s,x+w*0.5)-
      step(s,x-w*0.5);
      return clamp(d, 0.,1.);
  }

  //08
  float circleSDF(vec2 st){
    return length(st-0.5)*2.;
  }

  //09
  float fill(float x, float size){
    return 1.-step(size,x);
  }

  //15
  float triSDF(vec2 st){
    st = (st *2.-1.)*2.;
    return max(abs(st.x)* 0.866025 + st.y * 0.5, -st.y * 0.5);
  }

  //17
float rhombSDF(vec2 st){
  return max(triSDF(st),
     triSDF(vec2(st.x,1.-st.y))
     );
}

//19
vec2 rotate(vec2 st, float a){
  st = mat2(cos(a), -sin(a), sin(a), cos(a)) * (st-.5);
  return st+.5;
}


  float starSDF(vec2 st, int V, float s){
    st= st *4.-2.;
    float a= atan(st.y, st.x)/TAU;
    float seg = a * float(V);
    a=((floor(seg) + 0.5) / float(V) +
      mix(s,-s,step(0.5,fract(seg))))  * TAU;
    return abs(dot(vec2(cos(a),sin(a)),st));
  }

  //47
  float spiralSDF(vec2 st, float t){
    st-=0.5;
    float r=dot(st,st);
    float a= atan(st.y,st.x);
    return abs(sin(fract(log(r)*t+a*0.159)));
  }
  `