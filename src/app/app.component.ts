import { Component, ViewChild, ElementRef, AfterViewInit, OnInit, ViewChildren, QueryList } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators,FormBuilder } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as go from 'gojs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  constructor(private service_modal: NgbModal,
    private formBuilder: FormBuilder) {}

  inputs: { name: string; placeholder: string }[] = [];
  data_form!: FormGroup;
  data_form_edit!: FormGroup;
  totalName = 0;



  @ViewChild('diagramDiv', { static: false })
  diagramDiv!: ElementRef<any>;
  @ViewChild('Modal') addView_modal!: ElementRef<any>;
  @ViewChild('Modal_edit') addView_modal_edit!: ElementRef<any>;

  nodeDataArray: any[] = [];
  linkDataArray: any[] = [];
  nodeDataArray_modif: any[] = [];
  to_Value:any[]=[];

  private diagram: go.Diagram | undefined;
/*
  data_form = new FormGroup({
    key: new FormControl('', Validators.required),
    name: new FormControl('', Validators.required),
    color: new FormControl('green'),
    to: this.formBuilder.array([])

  });
*/



  ngAfterViewInit(): void {
    if (this.diagramDiv && this.diagramDiv.nativeElement) {
      const $ = go.GraphObject.make;

      this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
        layout: $(go.LayeredDigraphLayout, { direction: 0 }),
        'undoManager.isEnabled': true,
      });

      this.diagram.nodeTemplate = $(
        go.Node,
        'Auto',
        $(go.Shape, 'Circle', { fill: 'lightblue' }, new go.Binding('fill', 'color')),
        $(go.TextBlock, { margin: 5 }, new go.Binding('text', 'key'))
      );

      this.diagram.linkTemplate = $(
        go.Link,
        $(go.Shape, { stroke: 'black' }, new go.Binding('stroke', 'color')),
        $(go.TextBlock, { segmentOffset: new go.Point(0, -10) }, new go.Binding('text', 'text'))
      );



      this.diagram.model = new go.GraphLinksModel(this.nodeDataArray, this.linkDataArray);
    }
  }
  get toControls() {
    return this.data_form.get('to') as FormArray;
  }

  get toControls_edit(){
    return this.data_form_edit.get('to') as FormArray;
  }

  open_modal() {
    this.toControls.clear();
    this.service_modal.open(this.addView_modal, { ariaLabelledBy: 'Modal' }).result.then(() => {});
  }

  open_modal_edit(data: any) {
    this.toControls_edit.clear();
    this.data_form_edit.patchValue({
      key: data.key,
      name: data.name,
      color: 'lightgren',
    });

    let datas: any[] = data.to;

    console.log(datas.length);

    for(let i = 0; i<datas.length; i++){
      this.toControls_edit.push(this.formBuilder.control(datas[i]));
    }

    this.service_modal.open(this.addView_modal_edit, { ariaLabelledBy: 'Modal_edit' }).result.then(() => {

    });

  }

  ngOnInit(): void {
    this.data_form = this.formBuilder.group({
      key: ['',Validators.required],
      name: [0,Validators.required],
      color: ['',Validators.required],
      to: this.formBuilder.array([]),

    });

    this.data_form_edit = this.formBuilder.group({
      key: ['',Validators.required],
      name: [0,Validators.required],
      color: ['',Validators.required],
      to: this.formBuilder.array([])
    });
    console.log(this.nodeDataArray);
    this.nodeDataArray.forEach((node) => {
      node.earliestStart = 0; // Valeur initiale pour la date au plus tôt
      node.latestStart = 0; // Valeur initiale pour la date au plus tard
    });
  }

  ajouterTo() {
    this.toControls.push(this.formBuilder.control(''));
  }

  ajouterTo_edit() {
    this.toControls_edit.push(this.formBuilder.control(''));
  }


  supprimerTo(index: number) {
    this.toControls.removeAt(index);
  }


  supprimerTo_edit(index: number) {
    this.toControls_edit.removeAt(index);
  }
  Ajout_data() {
    if (this.data_form.value.name == null) {
      console.log('CHAMPS REQUIS');
    } else {

      let datas:any[] = this.data_form.value.to;
      let datas_Link:any[] = [];
      for(let i=0; i<datas.length;i++){
        this.linkDataArray.push({from:this.data_form.value.key,to:datas[i],text:this.data_form.value.key+"("+this.data_form.value.name+")"});
      }

      console.log(this.data_form.value.to);
      this.data_form.patchValue({ color: 'lightgreen',earlyStart:0 }); // Définir la valeur par défaut "green" pour le champ color
      this.nodeDataArray.push(this.data_form.value);
      console.log(this.linkDataArray);
      this.data_form.reset();
      this.updateDiagram(); // Mettre à jour le diagramme après l'ajout de données
      this.inputs = [];
      this.toControls.clear();
      this.ngOnInit();
    }
  }


  Modifier_data() {
    if (this.data_form_edit.valid) {
      // Récupérer les données modifiées depuis le formulaire
      let indexes: number[] = []; // Ajout de l'annotation de type explicite

      let modifiedData = this.data_form_edit.value;

      // Trouver les index des données à modifier
      indexes = this.nodeDataArray.reduce((acc, data, index) => {
        if (data.key === modifiedData.key) {
          acc.push(index);
        }
        return acc;
      }, []);

      // Mettre à jour les données correspondantes
      indexes.forEach((index: number) => {
        const node = this.nodeDataArray[index];
        node.key= modifiedData.key;
        node.name = parseInt(modifiedData.name);
        node.to = modifiedData.to;
        // Mettez à jour d'autres propriétés si nécessaire
      });

      // Mettre à jour les données de linkDataArray
      this.linkDataArray = this.linkDataArray.filter((link) => {
        return indexes.every((index) => link.from !== this.nodeDataArray[index].key);
      });

      const newLinks = modifiedData.to.map((toKey: string) => {
        return {
          from: modifiedData.key,
          to: toKey,
          text: modifiedData.key + "(" + modifiedData.name + ")"
        };
      });

      this.linkDataArray.push(...newLinks);

      // Réinitialiser le formulaire
      this.data_form_edit.reset();
      console.log(this.nodeDataArray);
      // Mettre à jour le diagramme
      this.updateDiagram();
    }
  }





  private updateDiagram() {
    if (this.diagram) {
      this.diagram.model = new go.GraphLinksModel(this.nodeDataArray,this.linkDataArray);
    }
  }




  criticalTasks: String[] = [];

  CPM(){
     // Réinitialiser les données du chemin critique
  this.criticalTasks = [];
  let tasks: any[] = [];
  // Copier les données des tâches dans un tableau temporaire
  tasks = this.nodeDataArray;

  // Calculer les dates au plus tôt
  tasks.forEach((task: any) => {
    const predecessors = this.linkDataArray
      .filter((link: any) => link.to === task.key)
      .map((link: any) => link.from);

    if (predecessors.length === 0) {
      task.earliestStart = 0;
    } else {
      let maxPredecessorFinish = 0;
      predecessors.forEach((predecessor: any) => {
        const predecessorTask = tasks.find((t: any) => t.key === predecessor);
        if (predecessorTask && predecessorTask.earliestFinish > maxPredecessorFinish) {
          maxPredecessorFinish = predecessorTask.earliestFinish;
        }
      });
      task.earliestStart = maxPredecessorFinish;
    }

    task.earliestFinish = task.earliestStart + task.name;
  });

  // Calculer les dates au plus tard et identifier le chemin critique
  let maxFinish = 0;
  tasks.reverse().forEach((task: any) => {
    if (task.earliestFinish > maxFinish) {
      maxFinish = task.earliestFinish;
    }


    const successors = this.linkDataArray
      .filter((link: any) => link.from === task.key)
      .map((link: any) => link.to);

    if (successors.length === 0) {
      task.latestFinish = maxFinish;
      task.latestStart = maxFinish - task.name;
    } else {
      let minSuccessorStart = maxFinish;
      successors.forEach((successor: any) => {
        const successorTask = tasks.find((t: any) => t.key === successor);
        if (successorTask && successorTask.latestStart < minSuccessorStart) {
          minSuccessorStart = successorTask.latestStart;
        }
      });
      task.latestFinish = minSuccessorStart;
      task.latestStart = minSuccessorStart - task.name;
    }

    if (task.earliestStart === task.latestStart && task.earliestFinish === task.latestFinish) {
      this.criticalTasks.push(task.key);
      this.totalName += task.name; // Ajouter la valeur de "name" à la somme

    }

  });
  console.log(this.nodeDataArray);
  console.log("Somme des 'name' des tâches du chemin critique:", this.totalName);
  // Mettre à jour le diagramme
  this.updateCriticalTasksColor();
}

updateCriticalTasksColor() {
  // Supposons que vous avez une variable contenant les clés des tâches critiques

  // Parcourir nodeDataArray
  for (const node of this.nodeDataArray) {
    // Vérifier si la clé de la tâche est présente dans les tâches critiques
    if (this.criticalTasks.includes(node.key)) {
      // Mettre à jour la couleur pour les tâches critiques
      node.color = 'red';
    } else {
      // Mettre à jour la couleur pour les autres tâches non critiques
      node.color = 'lightgreen';
    }
  }

  // Parcourir linkDataArray
// Parcourir linkDataArray
for (const link of this.linkDataArray) {
  // Vérifier si le lien est lié à une tâche critique
  if (this.criticalTasks.includes(link.from) && this.criticalTasks.includes(link.to)) {
    // Mettre à jour la couleur pour les liens liés à des tâches critiques
    link.color = 'red';
    link.stroke = 'red';
  } else {
    // Mettre à jour la couleur pour les autres liens
    link.color = 'black';
    link.stroke = 'black';
  }
}

  // Mettre à jour le diagramme avec les nouvelles couleurs
  this.updateDiagram();
}


  title = 'CPM_ANGULAR';
}
