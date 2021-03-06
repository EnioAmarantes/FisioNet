import React, { useState, useEffect } from "react";
import firebase from "firebase";
import { useSelector } from "react-redux";
import { Redirect } from "react-router";
import { Confirm } from 'react-st-modal';

import SideBar from "../../Components/sidebar";
import EditButton from "../../Components/buttons/editButton";
import DeleteButton from "../../Components/buttons/deleteButton";
import AVATAR_PADRAO from "../../Components/images/avatares/avatar-002.jpg";

const STATUS_COLOR_OK = 'lightgreen';
const STATUS_COLOR_EDIT = 'lightblue';
const STATUS_COLOR_REMOVE = 'orange';
const STATUS_COLOR_ERROR = 'orangered';
const STATUS_COLOR_DEFAULT = '#f7f7f7';

const STATUS = {
    OK: "ok",
    EDIT: "edit",
    REMOVE: "remove",
    ERRO: "erro"
}

const COLLECTION = 'pacientes';

const MSG_CARREGANDO = 'Carregando pacientes';
const MSG_CARREGADO = 'Pacientes carregados';
const MSG_CADASTRADO = 'Paciente cadastrado com sucesso!';
const MSG_EDITADO = 'Paciente editado com sucesso!';
const MSG_REMOVIDO = 'Paciente removido com sucesso!';

const MSG_CADASTRADO_ERRO = 'Não foi possível cadastrar o Paciente';
const MSG_EDITADO_ERRO = 'Não foi possível editar o Paciente';
const MSG_REMOVIDO_ERRO = 'Não foi possível remover o Paciente';

function Pacientes() {
    const [loadMode, setLoadMode] = useState(0);
    const [index, setIndex] = useState(0);
    const [msgStatus, setMsgStatus] = useState();

    const [pacientes, setPacientes] = useState([]);
    const [nomePaciente, setNomePaciente] = useState();
    const [idade, setIdade] = useState();
    const [tratamentos, setTratamentos] = useState([]);
    const [tratamento, setTratamento] = useState();
    const [proxConsulta, setProxConsulta] = useState();
    const [avatar, setAvatarNovo] = useState();
    const [urlImagem, setUrlImagem] = useState();


    const imgOpt = {
        types: [
            {
                description: 'Images',
                accept: {
                    'image/*': ['.png', '.gif', '.jpeg', '.jpg']
                }
            }
        ],
        excludeAcceptAllOption: true,
        multiple: false
    };

    const db = firebase.firestore();
    const storage = firebase.storage();

    var listaPacientes = [];
    var listaTratamentos = [];

    useEffect(() => {
        if (loadMode == 0)
            updateStatus(STATUS.OK, MSG_CARREGANDO);

        firebase.firestore().collection('tratamentos').get().then(async (res) => {
            await res.docs.forEach(doc => {
                listaTratamentos.push({
                    id: doc.id,
                    ...doc.data()
                });
                setTratamentos(listaTratamentos);
            })
        })

        firebase.firestore().collection(COLLECTION).get().then(async (res) => {
            await res.docs.forEach(doc => {
                listaPacientes.push({
                    id: doc.id,
                    ...doc.data()
                })
            })
            setPacientes(listaPacientes);
            if (loadMode == 0)
                updateStatus(STATUS.OK, MSG_CARREGADO);
        })

    }, [pacientes.length])

    async function tirarFoto() {
        let files = await window.showOpenFilePicker(imgOpt);

        let newFoto = await files[0].getFile();
        setAvatarNovo(await files[0].getFile());

        let reader = new FileReader();
        reader.readAsDataURL(newFoto);
        reader.onload = function (event) {
            document.getElementById("avatar").src = event.target.result;
        }
    }

    function registrar() {

        if (loadMode == 0) {
            if (avatar)
                storage.ref(`imagens/avatar/${avatar.name}`).put(avatar).then(() => {
                    db.collection(COLLECTION).add({
                        nomePaciente: nomePaciente,
                        idade: idade,
                        tratamento: tratamento,
                        proxConsulta: proxConsulta,
                        avatar: avatar.name
                    }).then(() => {
                        setLoadMode(1)
                        pacientes.push({
                            nomePaciente: nomePaciente,
                            idade: idade,
                            tratamento: tratamento,
                            proxConsulta: proxConsulta,
                            avatar: avatar.name
                        })
                        updateStatus(STATUS.OK, MSG_CADASTRADO);
                    }
                    ).catch((e) => {
                        console.log(MSG_CADASTRADO_ERRO);
                        console.log(e);
                        updateStatus(STATUS.ERRO, MSG_CADASTRADO_ERRO);
                    })
                })

        } else {
            if (avatar)
                storage.ref(`imagens/avatar/${avatar.name}`).put(avatar);

            console.log(avatar);
            db.collection(COLLECTION).doc(pacientes[index].id).update({
                nomePaciente: nomePaciente,
                idade: idade,
                tratamento: tratamento,
                proxConsulta: proxConsulta,
                avatar: avatar
            }).then(() => {
                pacientes[index].nomePaciente = nomePaciente;
                pacientes[index].idade = idade;
                pacientes[index].tratamento = tratamento;
                pacientes[index].proxConsulta = proxConsulta;
                pacientes[index].avatar = avatar;
                updateStatus(STATUS.EDIT, MSG_EDITADO);
            }).catch((e) => {
                console.log(MSG_EDITADO_ERRO);
                console.log(e);
                updateStatus(STATUS.ERRO, MSG_EDITADO_ERRO);
            })
        }
        clearMode();
    }


    function editar(value) {

        clearMode();

        let index = value.target.parentNode.parentNode.parentNode.rowIndex;
        setIndex(--index);
        setLoadMode(1);

        firebase.storage().ref(`imagens/avatar/${pacientes[index].avatar}`).getDownloadURL().then(url => {
            setUrlImagem(url);
        })

        document.getElementById("nomePaciente").value = pacientes[index].nomePaciente;
        document.getElementById("idade").value = pacientes[index].idade;
        document.getElementById("tratamento").value = pacientes[index].tratamento;
        document.getElementById("proxConsulta").value = pacientes[index].proxConsulta;
        document.getElementById("avatar").src = urlImagem;

        setAvatarNovo(pacientes[index].avatar);
        setNomePaciente(pacientes[index].nomePaciente);
        setIdade(pacientes[index].idade);
        setTratamento(pacientes[index].tratamento);
        setProxConsulta(pacientes[index].proxConsulta);

    }

    async function deletar(value) {
        setLoadMode(1)

        let index = value.target.parentNode.parentNode.parentNode.rowIndex;
        setIndex(--index);

        const result = await Confirm('Deseja realmente remover o Paciente?', 'Remover');

        if(result){
        storage.ref(`imagens/avatar/${pacientes[index].avatar.name}`).delete();

        db.collection(COLLECTION).doc(pacientes[index].id).delete()
            .then(() => {
                pacientes.splice(index, 1);
                updateStatus(STATUS.REMOVE, MSG_REMOVIDO);
            }).catch((e) => {
                console.log(MSG_REMOVIDO_ERRO);
                console.log(e);
                updateStatus(STATUS.ERRO, MSG_REMOVIDO_ERRO);
            })
        }
        clearMode();

    }

    function clearMode() {
        setIndex(0);
        setLoadMode(0);

        setNomePaciente("");
        setIdade("");
        setTratamento("");
        setProxConsulta("");
        setAvatarNovo("");

        document.getElementById("nomePaciente").value = "";
        document.getElementById("idade").value = "";
        document.getElementById("tratamento").value = "";
        document.getElementById("proxConsulta").value = "";
        document.getElementById("avatar").src = AVATAR_PADRAO;
    }

    function updateStatus(type, text) {
        console.log(text);

        setStatusColor(type);

        setMsgStatus(text)
        setTimeout(function () {
            setMsgStatus(null);
                setStatusColor();
        }, 3000);
    }

    function setStatusColor(type) {
        if(document.getElementById("divStatus") != null){
            switch (type) {
                case STATUS.OK:
                    document.getElementById("divStatus").style.backgroundColor = STATUS_COLOR_OK;
                    break;
                case STATUS.EDIT:
                    document.getElementById("divStatus").style.backgroundColor = STATUS_COLOR_EDIT;
                    break;
                case STATUS.REMOVE:
                    document.getElementById("divStatus").style.backgroundColor = STATUS_COLOR_REMOVE;
                    break;
                case STATUS.ERRO:
                    document.getElementById("divStatus").style.backgroundColor = STATUS_COLOR_ERROR;
                    break;
                default:
                    document.getElementById("divStatus").style.backgroundColor = STATUS_COLOR_DEFAULT;
                    ;
                    break;
            }
        }
    }

    return (
        <>
            {
                useSelector(state => state.userLoged) > 0 ?
                <>
                    <SideBar />

                    <div id="container" className="container justify-content-center col-12">
                        <div id="divStatus" className="text-center p-4 my-5"><span><strong>{msgStatus}</strong></span></div>
                        <form className="my-5">
                            <div className="form-group m-5">
                                <h2 className="text-center">{loadMode ? "Editar Pacientes" : "Cadastro de Pacientes"}</h2>
                                <div className="row my-3">
                                    <div className="col-md-4 col-xs-12">
                                        <div className="form-group">
                                            <img id="avatar" className="card-img" src={urlImagem ? urlImagem : AVATAR_PADRAO}
                                                alt="Imagem Aqui" />
                                            <button className="btn btn-login" type="button" onClick={tirarFoto}>Tire Foto
                                            </button>
                                        </div>
                                    </div>
                                    <div className="block col-8">
                                        <input id="nomePaciente" onChange={(e) => setNomePaciente(e.target.value)} className="form-control my-2" type="text"
                                            placeholder="Nome do paciente" />
                                        <input id="idade" onChange={(e) => setIdade(e.target.value)} className="form-control my-2" type="number" placeholder="Idade" />
                                        <label htmlFor="tratamento">Tratamento</label>
                                        <select id="tratamento" value={tratamento} onChange={(e) => setTratamento(e.target.value)} className="form-control my-2">
                                            <option defaultValue>Selecione um Tratamento</option>
                                            {
                                                tratamentos.map(item => {
                                                    return (
                                                        <option key={item.id} value={item.nomeTratamento}>{item.nomeTratamento}</option>
                                                    )
                                                })
                                            }
                                        </select>
                                        <label className="" htmlFor="prox_consulta">Próxima Consulta</label>
                                        <input id="proxConsulta" onChange={(e) => setProxConsulta(e.target.value)} className="form-control my-2" type="date" />
                                    </div>
                                </div>
                            </div>
                            <button id="btnPaciente" type="button" className="btn btn-login my-2"
                                onClick={registrar}>{loadMode ? "Editar" : "Cadastrar"}</button>
                        </form>

                        <table id="pacientesTab" className="table table-hover">
                            <thead key="thread">
                                <tr>
                                    <th>Nome</th>
                                    <th>Idade</th>
                                    <th>Tratamento</th>
                                    <th>Próxima Consulta</th>
                                    <th className="text-center">Opções</th>
                                </tr>
                            </thead>

                            <tbody key="tbody">
                                {
                                    pacientes.map(item => {
                                        return (<tr key={item.id}>
                                            <th scope="row">{item.nomePaciente}</th>
                                            <th>{item.idade}</th>
                                            <th>{item.tratamento}</th>
                                            <th>{item.proxConsulta}</th>
                                            <th className="text-center">
                                                <span onClick={editar}><EditButton /></span>
                                                <span onClick={deletar}><DeleteButton /></span>
                                            </th>
                                        </tr>)
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                </>
                :
                <>
                <Redirect to="home" />
                </>
            }
        </>
    );
}

export default Pacientes;