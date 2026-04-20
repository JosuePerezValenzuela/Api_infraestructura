import { forwardRef, Module } from '@nestjs/common';
import { AmbienteController } from './interface/ambiente.controller';
import { CreateAmbienteUseCase } from './application/create-ambiente.usecase';
import { ListAmbientesUseCase } from './application/list-ambientes.usecase';
import { ListAmbientesDisponiblesUseCase } from './application/list-ambientes-disponibles.usecase';
import { ListAmbienteHorariosUseCase } from './application/list-ambiente-horarios.usecase';
import { DeleteAmbienteUseCase } from './application/delete-ambiente.usecase';
import { UpdateAmbienteUseCase } from './application/update-ambiente.usecase';
import { ReplaceHorariosUseCase } from './application/replace-horarios.usecase';
import { GetAmbienteCompletoUseCase } from './application/get-ambiente-completo.usecase';
import { BuscarAmbienteHorarioUseCase } from './application/buscar-ambiente-horario.usecase';
import { AmbienteRepositoryPort } from './domain/ambiente.repository.port';
import { AmbientesDisponiblesRepositoryPort } from './domain/ambiente.disponibles.port';
import { HorarioRepositoryPort } from './domain/horario.repository.port';
import { TypeormAmbienteRepository } from './infrastructure/persistence/typeorm-ambiente.repository';
import { TypeormAmbientesDisponiblesRepository } from './infrastructure/persistence/typeorm-ambientes-disponibles.repository';
import { TypeormHorarioRepository } from './infrastructure/persistence/typeorm-horario.repository';
import { BloqueModule } from '../bloque/bloque.module';
import { TipoAmbienteModule } from '../tipo-ambiente/tipo-ambiente.module';
import { ActivoModule } from '../activo/activo.module';

@Module({
  imports: [BloqueModule, TipoAmbienteModule, forwardRef(() => ActivoModule)],
  controllers: [AmbienteController],
  providers: [
    CreateAmbienteUseCase,
    ListAmbientesUseCase,
    ListAmbientesDisponiblesUseCase,
    ListAmbienteHorariosUseCase,
    DeleteAmbienteUseCase,
    UpdateAmbienteUseCase,
    ReplaceHorariosUseCase,
    GetAmbienteCompletoUseCase,
    BuscarAmbienteHorarioUseCase,
    {
      provide: AmbienteRepositoryPort,
      useClass: TypeormAmbienteRepository,
    },
    {
      provide: AmbientesDisponiblesRepositoryPort,
      useClass: TypeormAmbientesDisponiblesRepository,
    },
    {
      provide: HorarioRepositoryPort,
      useClass: TypeormHorarioRepository,
    },
  ],
  exports: [
    AmbienteRepositoryPort,
    CreateAmbienteUseCase,
    ListAmbientesUseCase,
    ListAmbientesDisponiblesUseCase,
    ListAmbienteHorariosUseCase,
    DeleteAmbienteUseCase,
    UpdateAmbienteUseCase,
    ReplaceHorariosUseCase,
    HorarioRepositoryPort,
    BuscarAmbienteHorarioUseCase,
  ],
})
export class AmbienteModule {}
