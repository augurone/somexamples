$(function(){
    $.getJSON('sample_metadata_array1.json', function(data) {
        root = data.Patients;
        for(key in root) {
            for(i = 0; i < root.length; i++){
                // LEVEL 1 DATA
                pat = [];
                for (property in root[i]){
                    if (typeof root[i][property]=== "object"){
                            for (j=0; j< root[i][property].length; j++){
                                report = [];
                                // LEVEL 2 Data
                                for (attr in root[i][property][j]){
                                    if (typeof root[i][property][j][attr] === "object"){
                                        // LEVEL 3 Data    
                                        images = [];
                                        for (k = 0; k < root[i][property][j][attr].length; k++){
                                            for (child in root[i][property][j][attr][k]){
                                                var imgdata = child+'='+root[i][property][j][attr][k][child];
                                                images.push(imgdata);
                                            };
                                        };
                                        report.push(images);
                                        // END LEVEL 3 Data
                                    }else{
                                        repdata = attr +'='+root[i][property][j][attr];
                                        report.push(repdata);
                                    }
                                }
                                pat.push(report);
                                // END LEVEL 2 Data
                            }
                    }else{
                        patdata = property+'='+root[i][property];
                    };
                    pat.push(patdata);
                    // END LEVEL 1 PATIENT DATA
                };
                console.log(pat)
            };
        };
    });
});		

